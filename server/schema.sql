-- Create Database
CREATE DATABASE IF NOT EXISTS login_system;
USE login_system;

-- Table: Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email TEXT NOT NULL, -- Encrypted (Ciphertext)
  email_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 Hash for Lookups
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'user') NOT NULL DEFAULT 'user',
  level ENUM('super_admin', 'regular') NOT NULL DEFAULT 'regular',
  restrictions JSON, -- Stores array like ["view", "add", "edit"]
  status ENUM('active', 'archived', 'locked') NOT NULL DEFAULT 'active',
  failed_attempts INT DEFAULT 0,
  lock_until DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL,
  created_by INT NULL, -- ID of the user who created this account
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table: Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  username_snapshot VARCHAR(50), -- Kept in case user is deleted
  action VARCHAR(50) NOT NULL,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
