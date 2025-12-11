-- Unlock Admin & Reset Password
UPDATE users 
SET 
    status = 'active',
    failed_attempts = 0,
    lock_until = NULL,
    -- Reset to 'Admin@12' (Hash: $2b$10$2ylTxM8zEvHTqoVLufh6fZJ/m3bQrYekM1gJmbDu)
    password_hash = '$2b$10$2ylTxM8zEvHTqoVLufh6fZJ/m3bQrYekM1gJmbDu'
WHERE username = 'admin';
