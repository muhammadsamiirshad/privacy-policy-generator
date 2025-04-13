const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const CryptoJS = require('crypto-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Create the db directory using absolute path
const dbDir = path.resolve(__dirname, '..', 'db');
console.log('Database directory path:', dbDir);

if (!fs.existsSync(dbDir)) {
  console.log('Creating database directory');
  fs.mkdirSync(dbDir, { recursive: true });
}

// Define database file path
const dbPath = path.join(dbDir, 'privacy_policy_generator.db');
console.log('Database file path:', dbPath);

// Connect to SQLite database with absolute path
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
    initDb();
  }
});

// Enhanced AES encryption functions
function encrypt(text) {
  if (!text) return null;
  try {
    // Generate a random salt
    const salt = CryptoJS.lib.WordArray.random(128/8);
    
    // Key derivation with PBKDF2
    const key = CryptoJS.PBKDF2(
      process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 
      salt, 
      { keySize: 256/32, iterations: 1000 }
    );
    
    // Random IV
    const iv = CryptoJS.lib.WordArray.random(128/8);
    
    // Encrypt with AES-CBC
    const encrypted = CryptoJS.AES.encrypt(text, key, { 
      iv: iv, 
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    
    // Combine the IV and encrypted message
    const result = salt.toString() + iv.toString() + encrypted.toString();
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

function decrypt(ciphertext) {
  if (!ciphertext) return null;
  try {
    // Extract the salt (first 32 chars)
    const salt = CryptoJS.enc.Hex.parse(ciphertext.substr(0, 32));
    
    // Extract the IV (next 32 chars)
    const iv = CryptoJS.enc.Hex.parse(ciphertext.substr(32, 32));
    
    // Extract the actual encrypted text
    const encrypted = ciphertext.substring(64);
    
    // Derive the same key
    const key = CryptoJS.PBKDF2(
      process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 
      salt, 
      { keySize: 256/32, iterations: 1000 }
    );
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, { 
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Initialize database with tables
function initDb() {
  // Users table with additional security fields
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullName TEXT,
    encryptedEmail TEXT,
    encryptedUsername TEXT,
    encryptedFullName TEXT,
    encrypted_preferences TEXT,
    encrypted_settings TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    account_status TEXT DEFAULT 'active',
    failed_login_attempts INTEGER DEFAULT 0,
    last_password_change TIMESTAMP
  )`);

  // Policies table with enhanced encryption
  db.run(`CREATE TABLE IF NOT EXISTS policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    policy_id TEXT UNIQUE NOT NULL,
    website_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    policy_text TEXT NOT NULL,
    encrypted_policy_text TEXT,
    encrypted_website_name TEXT,
    encrypted_company_name TEXT,
    encrypted_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create logs table for security tracking
  db.run(`CREATE TABLE IF NOT EXISTS security_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT,
    details TEXT,
    encrypted_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  console.log('Database tables created or already exist.');
}

module.exports = {
  db,
  encrypt,
  decrypt
};