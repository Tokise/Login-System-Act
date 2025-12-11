/*
  Usage:
  1. Login to phpMyAdmin (http://localhost/phpmyadmin)
  2. Select database 'login_system'
  3. Import 'server/schema.sql'
  
  Note: Default admin hash in schema is a placeholder. Server auto-fixes on start.
*/

import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = 3000;

// --- Encryption Config ---
// In production, move these to .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.createHash('sha256').update('my_secret_key_123').digest('base64').substr(0, 32);
const IV_LENGTH = 16;

// --- Helper: Encrypt ---
function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// --- Helper: Decrypt ---
function decrypt(text) {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (err) {
        return text; // Return original if fail (e.g. not encrypted)
    }
}

// --- Helper: Hash (For Lookups) ---
function hashEmail(email) {
    return crypto.createHash('sha256').update(email).digest('hex');
}

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    req.clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    req.userAgent = req.get('User-Agent');
    next();
});

// --- Database Connection ---
const pool = mysql.createPool({
    host: process.env.VITE_DB_HOST || 'localhost',
    user: process.env.VITE_DB_USER || 'root',
    password: process.env.VITE_DB_PASSWORD || '',
    database: process.env.VITE_DB_NAME || 'login_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- Helper: Log Activity ---
async function logActivity(userId, username, action, details, req) {
    try {
        await pool.query(
            'INSERT INTO activity_logs (user_id, username_snapshot, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, username, action, details, req.clientIp, req.userAgent]
        );
    } catch (err) {
        console.error('Logging failed:', err);
    }
}

// --- Init DB ---
async function initDB() {
    try {
        // Ensure password_resets table exists (We can keep this for future, or ignore it. Let's keep it but not use it.)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        const correctHash = await bcrypt.hash('Admin@12', 10);

        // Use INSERT IGNORE to prevent crashes on duplicates
        const email = 'admin@local.com';
        await pool.query(
            `INSERT IGNORE INTO users (username, email, email_hash, password_hash, role, level, restrictions, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['super_admin', encrypt(email), hashEmail(email), correctHash, 'super_admin', 'super_admin', JSON.stringify([]), 'active']
        );
        console.log('DB Initialized. Super Admin guaranteed.');

    } catch (err) {
        console.error('DB Init Error:', err);
    }
}
initDB();

// --- Authentication Routes ---

// Direct Password Reset (No Token) - For User Convenience (Weak Security, Demo only)
app.post('/api/reset-password-direct', async (req, res) => {
    let { username, email, newPassword } = req.body;

    if (!username || !email || !newPassword) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    username = username.trim();
    email = email.trim();

    try {
        // 1. Verify User Exists by Username (Whitespace insensitive)
        // We use LIKE to be case-insensitive and we'll trim DB side if needed, 
        // but for now let's just try to match TRIM(username)
        const [users] = await pool.query('SELECT * FROM users WHERE TRIM(username) = ?', [username]);

        if (users.length === 0) return res.status(400).json({ error: 'Invalid details (User not found)' });
        const user = users[0];

        // 2. Verify Email Matches
        const providedHash = hashEmail(email);

        // Debugging for User:
        if (user.email_hash !== providedHash) {
            console.log(`Email Mismatch! Stored Hash vs Input Hash`);
            return res.status(400).json({ error: 'Invalid details (Email mismatch)' });
        }

        // 3. Check Lock Status
        if (user.status === 'locked') {
            return res.status(403).json({ error: 'Account is locked. Cannot reset password.' });
        }

        // 4. Update Password and Reset Attempts
        const hash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ?, failed_attempts = 0 WHERE id = ?', [hash, user.id]);

        await logActivity(user.id, user.username, 'PASSWORD_RESET', 'User reset password (Direct)', req);

        res.json({ success: true, message: 'Password reset successful.' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Try to find by Username OR Email Hash
        const hashedEmail = hashEmail(username); // If username input is actually an email
        const [users] = await pool.query('SELECT * FROM users WHERE username = ? OR email_hash = ?', [username, hashedEmail]);

        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];

        if (user.status === 'locked') {
            if (user.lock_until && new Date(user.lock_until) > new Date()) {
                return res.status(403).json({ error: 'Account locked. Try again later.' });
            }
            // Auto unlock
            await pool.query('UPDATE users SET status = "active", failed_attempts = 0, lock_until = NULL WHERE id = ?', [user.id]);
        }

        if (user.status === 'archived') return res.status(403).json({ error: 'Account is archived.' });

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            const attempts = user.failed_attempts + 1;
            if (attempts >= 3) {
                const lockTime = new Date(Date.now() + 15 * 60000); // 15 mins
                await pool.query('UPDATE users SET status = "locked", failed_attempts = ?, lock_until = ? WHERE id = ?',
                    [attempts, lockTime, user.id]);
                await logActivity(user.id, user.username, 'ACCOUNT_LOCKED', '3 Failed Login Attempts', req);
                return res.status(403).json({ error: 'Account locked due to too many failed attempts.' });
            } else {
                await pool.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [attempts, user.id]);
            }
            return res.status(401).json({ error: `Invalid credentials. Attempts: ${attempts}/3` });
        }

        // Success - Reset Failures
        await pool.query('UPDATE users SET failed_attempts = 0, lock_until = NULL, last_login_at = NOW() WHERE id = ?', [user.id]);

        // Log Login
        await logActivity(user.id, user.username, 'Login', 'Successful login', req);

        // Decrypt email for frontend
        user.email = decrypt(user.email);
        delete user.password_hash;
        delete user.email_hash;

        res.json({ success: true, user });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- User Management Routes ---

app.get('/api/users', async (req, res) => {
    const performActionBy = req.headers['x-user-id'];
    if (!performActionBy) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [admins] = await pool.query('SELECT * FROM users WHERE id = ?', [performActionBy]);
        if (admins.length === 0) return res.status(401).json({ error: 'User not found' });
        const admin = admins[0];

        const restrictions = typeof admin.restrictions === 'string' ? JSON.parse(admin.restrictions) : admin.restrictions;
        const canView = admin.level === 'super_admin' || restrictions.includes('view');

        if (!canView) return res.status(403).json({ error: 'Permission denied' });

        const [users] = await pool.query('SELECT id, username, email, role, level, restrictions, status, failed_attempts, created_at FROM users ORDER BY created_at DESC');

        // Decrypt all emails
        const decryptedUsers = users.map(u => ({
            ...u,
            email: decrypt(u.email)
        }));

        res.json(decryptedUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { username, email, password, role, restrictions } = req.body;
    const performActionBy = req.headers['x-user-id'];

    if (!performActionBy) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [creators] = await pool.query('SELECT * FROM users WHERE id = ?', [performActionBy]);
        if (creators.length === 0) return res.status(401).json({ error: 'Creator not found' });
        const creator = creators[0];

        const creatorRestrictions = typeof creator.restrictions === 'string' ? JSON.parse(creator.restrictions) : creator.restrictions;
        const canAdd = creator.level === 'super_admin' || (creator.role === 'admin' && creatorRestrictions.includes('add'));

        if (!canAdd) return res.status(403).json({ error: 'Permission denied: Cannot add users.' });

        if (creator.level !== 'super_admin' && role === 'admin') {
            return res.status(403).json({ error: 'Permission denied: Admins can only create Regular Users.' });
        }

        const hash = await bcrypt.hash(password, 10);
        const encryptedEmail = encrypt(email);
        const hashedEmail = hashEmail(email);

        await pool.query(
            'INSERT INTO users (username, email, email_hash, password_hash, role, restrictions, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, encryptedEmail, hashedEmail, hash, role, JSON.stringify(restrictions || []), creator.id]
        );

        await logActivity(creator.id, creator.username, 'CREATE_USER', `Created user ${username} (${role})`, req);
        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: 'Failed to create user. unique constraint?' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const targetUserId = req.params.id;
    const updates = req.body;
    const performActionBy = req.headers['x-user-id'];

    if (!performActionBy) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [actors] = await pool.query('SELECT * FROM users WHERE id = ?', [performActionBy]);
        if (actors.length === 0) return res.status(401).json({ error: 'Unauthorized' });
        const actor = actors[0];

        const [targets] = await pool.query('SELECT * FROM users WHERE id = ?', [targetUserId]);
        if (targets.length === 0) return res.status(404).json({ error: 'User not found' });
        const target = targets[0];

        // Permissions
        const actorRestrictions = typeof actor.restrictions === 'string' ? JSON.parse(actor.restrictions) : actor.restrictions;
        const isSuper = actor.level === 'super_admin';
        const isAdmin = actor.role === 'admin';
        const hasEditPermission = isSuper || (isAdmin && actorRestrictions.includes('edit'));
        const isSelfUpdate = parseInt(actor.id) === parseInt(targetUserId);

        // 1. General Access Check
        if (!isSelfUpdate && !hasEditPermission) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // 2. Hierarchy Check (Prevent Admins from modifying other Admins or Super Admins)
        if (!isSelfUpdate && !isSuper) {
            if (target.level === 'super_admin') return res.status(403).json({ error: 'Cannot modify Super Admin.' });
            if (target.role === 'admin') return res.status(403).json({ error: 'Cannot modify other Admins.' });
        }

        // 3. Build Safe Updates
        const safeUpdates = {};

        // Password: Self or Admin/Super can change
        if (updates.password) {
            safeUpdates.password_hash = await bcrypt.hash(updates.password, 10);
        }

        // Handle Email Update (Encrypt + Hash)
        if (updates.email) {
            safeUpdates.email = encrypt(updates.email);
            safeUpdates.email_hash = hashEmail(updates.email);
        }

        // Administrative Fields: Only Admin/Super can change
        if (hasEditPermission) {
            if (updates.status) safeUpdates.status = updates.status;
            if (updates.restrictions) safeUpdates.restrictions = JSON.stringify(updates.restrictions);

            if (updates.failedAttempts === 0) {
                safeUpdates.failed_attempts = 0;
                safeUpdates.lock_until = null;
            }
        }

        // Super Admin Fields: Only Super Admin can change Role
        if (isSuper && updates.role) {
            safeUpdates.role = updates.role;
        }

        // Apply Updates
        if (Object.keys(safeUpdates).length > 0) {
            await pool.query('UPDATE users SET ? WHERE id = ?', [safeUpdates, targetUserId]);

            // Log Activity
            let actionType = 'UPDATE_USER';
            if (isSelfUpdate && safeUpdates.password_hash && Object.keys(safeUpdates).length === 1) {
                actionType = 'PASSWORD_CHANGE';
            }

            await logActivity(actor.id, actor.username, actionType, `Updated user ${target.username}`, req);
        }

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Activity Logs Routes ---

app.get('/api/logs', async (req, res) => {
    const performActionBy = req.headers['x-user-id'];
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [performActionBy]);
        if (users.length === 0 || users[0].level !== 'super_admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [logs] = await pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 500');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/:id/logs/latest', async (req, res) => {
    const performActionBy = req.headers['x-user-id'];
    const targetUserId = req.params.id;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [performActionBy]);
        if (users.length === 0) return res.status(403).json({ error: 'Access denied' });

        const admin = users[0];
        const restrictions = typeof admin.restrictions === 'string' ? JSON.parse(admin.restrictions) : admin.restrictions;
        const canView = admin.level === 'super_admin' || restrictions.includes('view');

        if (!canView) return res.status(403).json({ error: 'Permission denied' });

        const [logs] = await pool.query(
            'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1',
            [targetUserId]
        );

        res.json(logs.length > 0 ? logs[0] : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

