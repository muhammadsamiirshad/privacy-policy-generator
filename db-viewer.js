/**
 * Privacy Policy Generator - Database Viewer
 * This utility script displays all data stored in the database
 * FOR DEVELOPMENT USE ONLY
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { db, decrypt } = require('./config/database');
require('dotenv').config();

// Set to true to try decrypting encrypted fields
const DECRYPT_FIELDS = false;

// Helper function to mask sensitive data
function maskSensitiveData(str, visibleChars = 4) {
  if (!str) return '';
  if (str.length <= visibleChars * 2) return '*'.repeat(str.length);
  
  const start = str.substring(0, visibleChars);
  const end = str.substring(str.length - visibleChars);
  return `${start}${'*'.repeat(str.length - (visibleChars * 2))}${end}`;
}

// Helper function to truncate long text
function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Format dates
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString();
}

// Console table formatter for better display
function consoleTable(data, title) {
  console.log(`\n====== ${title} ======`);
  if (data.length === 0) {
    console.log('No data found.');
    return;
  }
  console.table(data);
}

// Query all tables and display their contents
async function viewDatabaseContents() {
  try {
    console.log('\n=================================================');
    console.log('DATABASE VIEWER - PRIVACY POLICY GENERATOR');
    console.log('=================================================');
    console.log('WARNING: This tool displays database contents for debugging purposes.');
    console.log('Sensitive data is masked for security.\n');

    // Query and display users
    db.all('SELECT id, username, email, password, fullName, encryptedEmail, encryptedUsername, encryptedFullName, created_at, last_login, account_status, failed_login_attempts, last_password_change FROM users', [], (err, users) => {
      if (err) {
        console.error('Error querying users:', err.message);
        return;
      }
      
      // Process and mask sensitive user data
      const processedUsers = users.map(user => {
        const processed = { ...user };
        processed.password = maskSensitiveData(processed.password, 0);
        processed.email = maskSensitiveData(processed.email);
        
        // Try decrypting encrypted fields if enabled
        if (DECRYPT_FIELDS) {
          try {
            if (processed.encryptedEmail) {
              processed.decryptedEmail = decrypt(processed.encryptedEmail);
            }
            if (processed.encryptedUsername) {
              processed.decryptedUsername = decrypt(processed.encryptedUsername);
            }
            if (processed.encryptedFullName) {
              processed.decryptedFullName = decrypt(processed.encryptedFullName);
            }
          } catch (error) {
            console.error('Decryption error:', error);
          }
        }
        
        processed.created_at = formatDate(processed.created_at);
        processed.last_login = formatDate(processed.last_login);
        processed.last_password_change = formatDate(processed.last_password_change);
        
        // Remove encrypted fields from display for readability
        if (!DECRYPT_FIELDS) {
          delete processed.encryptedEmail;
          delete processed.encryptedUsername;
          delete processed.encryptedFullName;
        }
        
        return processed;
      });
      
      consoleTable(processedUsers, 'USERS');
      
      // Then query policies
      db.all('SELECT id, user_id, policy_id, website_name, company_name, substr(policy_text, 1, 200) AS policy_text_preview, created_at FROM policies', [], (err, policies) => {
        if (err) {
          console.error('Error querying policies:', err.message);
          return;
        }
        
        // Process policies
        const processedPolicies = policies.map(policy => {
          const processed = { ...policy };
          processed.policy_text_preview = truncateText(processed.policy_text_preview);
          processed.created_at = formatDate(processed.created_at);
          return processed;
        });
        
        consoleTable(processedPolicies, 'POLICIES');
        
        // Finally query security logs
        db.all('SELECT id, user_id, action, ip_address, substr(user_agent, 1, 50) AS user_agent, status, details, created_at FROM security_logs ORDER BY created_at DESC LIMIT 100', [], (err, logs) => {
          if (err) {
            console.error('Error querying security logs:', err.message);
            return;
          }
          
          // Process logs
          const processedLogs = logs.map(log => {
            const processed = { ...log };
            processed.user_agent = truncateText(processed.user_agent, 50);
            processed.details = truncateText(processed.details);
            processed.created_at = formatDate(processed.created_at);
            processed.ip_address = maskSensitiveData(processed.ip_address, 3);
            return processed;
          });
          
          consoleTable(processedLogs, 'SECURITY LOGS (LAST 100)');
          
          // Display database statistics
          console.log('\n=================================================');
          console.log('DATABASE STATISTICS');
          console.log('=================================================');
          console.log(`Total users: ${users.length}`);
          console.log(`Total policies: ${policies.length}`);
          console.log(`Total security logs: ${logs.length > 100 ? '100+ (showing latest 100)' : logs.length}`);
          console.log('=================================================');
          
          // Close database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database connection:', err.message);
            } else {
              console.log('\nDatabase connection closed.');
            }
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Error viewing database contents:', error);
    db.close();
  }
}

// Run the viewer
viewDatabaseContents();

/**
 * To use this script, run:
 * node db-viewer.js
 * 
 * WARNING: This script is for development and debugging purposes only.
 * Do not use in production environments or expose sensitive data.
 */
