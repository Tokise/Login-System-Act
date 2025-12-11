# Secure Login System & Dashboard

A comprehensive, production-ready User Management System built with **React (Vite)** and **Node.js (Express)**, featuring strict Role-Based Access Control (RBAC), activity logging, and enterprise-grade security practices.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Routing**: React Router 7
- **State Management**: Context API
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast notifications)
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (using `mysql2/promise`)
- **Security**:
  - `bcrypt`: Password hashing (Salt rounds: 10)
  - `cors`: Cross-Origin Resource Sharing control
  - Cookie-based session management (Custom implementation)

---

## ✨ Features

### 🔐 Authentication & Security
- **Secure Login**: Session-based authentication using MySQL backend.
- **Strict Password Policy**:
  - Minimum 8 characters
  - Must include: Uppercase, Lowercase, Number, Special Character
- **Brute Force Protection**:
  - Accounts lock automatically after **3 failed attempts**.
  - Super Admin is notified of locked accounts.
- **Session Timeout**: Auto-logout after **5 minutes** of inactivity.

### 👥 User Management (RBAC)
- **Super Admin**: Full control (Create, Edit, View, Archive, Unlock).
- **Admin**: Can create/manage "Regular Users" only.
- **Regular User**: Limited access based on assigned restrictions.
- **Granular Permissions**:
  - Custom restrictions: `can_view`, `can_add`, `can_edit`.

### 📜 Activity Logging
- **Audit Trails**: Every action (Login, Creation, Update, Lockout) is logged.
- **Detailed Logs**: Includes Timestamp, User, Action, IP Address, and User Agent.
- **Traceability**: Logs retain the `username_snapshot` even if the user is deleted.

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL Server (e.g., XAMPP, MySQL Workbench)

### 1. Database Setup
1. Open your MySQL client (e.g., phpMyAdmin).
2. Create a new database named `login_system`.
3. Import the provided schema file: `server/schema.sql`.
   - *This will create the tables and a default Super Admin account.*
   - **Default Credentials**:
     - Username: `admin`
     - Password: `Admin@12`

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (optional if using defaults in code, but recommended for production):
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=login_system
PORT=3000
```

### 4. Run the Application
You need to run both the backend and frontend servers.

**Option A: Separate Terminals (Recommended)**
```bash
# Terminal 1 (Backend)
npm run server

# Terminal 2 (Frontend)
npm run dev
```

**Access the App**:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

---

## 🛡️ Security Implementation Details

### Password Hashing
All passwords are hashed using **Bcrypt** before storage. We never store plain-text passwords.

### Role Hierarchy & Self-Updates
- **Hierarchy**: Admin cannot edit Super Admin. Admin cannot edit other Admins.
- **Self-Update**: Users can securely change their own password via the Settings page without needing administrative rights. Sensitive fields (Role, Status) are protected from self-modification.

### Database Schema
See `server/schema.sql` for the full normalized schema structure, optimized for auditability with `created_by` and `timestamp` tracking.

---

## ☁️ Deployment (Future Proofing)
This project is configured with `firebase-tools` for potential future deployment.
- **Frontend**: Can be deployed to Firebase Hosting.
- **Backend**: Can be migrated to Firebase Cloud Functions (requires code adaptation).
- **Database**: Requires migration to a Cloud Database (e.g., Google Cloud SQL or Firebase Firestore).