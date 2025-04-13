const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, encrypt, decrypt } = require('../config/database');
const { isAuthenticated, isGuest } = require('../middleware/auth');
require('dotenv').config();

// Get current authenticated user info
router.get('/user', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Query the database for user info excluding the password
  db.get(
    'SELECT id, username, email, fullName, created_at FROM users WHERE id = ?', 
    [req.session.userId], 
    (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        // Clear invalid session
        req.session.destroy();
        return res.status(404).json({ message: 'User not found' });
      }

      // Return user info
      res.json({ user });
    }
  );
});

// Register a new user
router.post('/register', [
  check('username').trim().notEmpty().withMessage('Username is required')
    .isAlphanumeric().withMessage('Username must contain only letters and numbers')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  check('email').trim().isEmail().withMessage('Valid email is required'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(error => error.msg) });
  }

  const { username, email, password, fullName } = req.body;

  // Check if user already exists
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error during registration' });
    }

    if (user) {
      return res.status(400).json({ message: 'User with this username or email already exists' });
    }

    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Encrypt ALL sensitive data with AES
      const encryptedEmail = encrypt(email);
      const encryptedUsername = encrypt(username);
      const encryptedFullName = fullName ? encrypt(fullName) : null;
      
      // Encrypt additional user data 
      const encryptedUserData = encrypt(JSON.stringify({
        registrationDate: new Date(),
        registrationIP: req.ip,
        userAgent: req.headers['user-agent']
      }));

      // Insert new user into database with encrypted fields
      db.run(
        `INSERT INTO users (
          username, email, password, fullName, 
          encryptedEmail, encryptedUsername, encryptedFullName,
          encrypted_preferences, encrypted_settings,
          created_at, last_password_change
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [username, email, hashedPassword, fullName, encryptedEmail, encryptedUsername, encryptedFullName, null, encryptedUserData],
        function(err) {
          if (err) {
            console.error('Error saving user:', err);
            return res.status(500).json({ message: 'Failed to create account' });
          }

          // Log security event
          const userId = this.lastID;
          db.run(
            'INSERT INTO security_logs (user_id, action, ip_address, status, details, encrypted_details) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, 'REGISTER', req.ip, 'SUCCESS', 'New account created', encrypt(`New account created for ${username} (${email})`)],
            (logErr) => {
              if (logErr) console.error('Error logging security event:', logErr);
            }
          );

          // Return success
          res.status(201).json({ 
            message: 'Registration successful',
            userId: userId
          });
        }
      );
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  });
});

// Login
router.post('/login', [
  check('email').trim().isEmail().withMessage('Valid email is required'),
  check('password').notEmpty().withMessage('Password is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(error => error.msg) });
  }

  const { email, password, rememberMe } = req.body;

  // Find user by email
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error during login' });
    }

    // If no user found or password doesn't match
    if (!user) {
      // Log failed login attempt
      db.run(
        'INSERT INTO security_logs (action, ip_address, status, details) VALUES (?, ?, ?, ?)',
        ['LOGIN', req.ip, 'FAIL', 'User not found: ' + email],
        (logErr) => {
          if (logErr) console.error('Error logging security event:', logErr);
        }
      );
      
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked or disabled
    if (user.account_status !== 'active') {
      db.run(
        'INSERT INTO security_logs (user_id, action, ip_address, status, details) VALUES (?, ?, ?, ?, ?)',
        [user.id, 'LOGIN', req.ip, 'BLOCKED', `Account status: ${user.account_status}`],
        (logErr) => {
          if (logErr) console.error('Error logging security event:', logErr);
        }
      );
      
      return res.status(403).json({ message: 'Account is locked or inactive. Please contact support.' });
    }

    try {
      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        // Increment failed login attempts
        db.run('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?', [user.id]);
        
        // Log failed login
        db.run(
          'INSERT INTO security_logs (user_id, action, ip_address, status, details) VALUES (?, ?, ?, ?, ?)',
          [user.id, 'LOGIN', req.ip, 'FAIL', 'Invalid password'],
          (logErr) => {
            if (logErr) console.error('Error logging security event:', logErr);
          }
        );
        
        // Check if we need to lock the account (after 5 failed attempts)
        if (user.failed_login_attempts >= 4) {  // This will make it 5 total after the increment above
          db.run('UPDATE users SET account_status = ? WHERE id = ?', ['locked', user.id]);
        }
        
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Reset failed login attempts
      db.run('UPDATE users SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      // Generate JWT token
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      // Set token expiration - 24 hours or 30 days for "remember me"
      const expiresIn = rememberMe ? '30d' : '24h';

      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
        { expiresIn },
        (err, token) => {
          if (err) {
            console.error('JWT Sign Error:', err);
            return res.status(500).json({ message: 'Error creating authentication token' });
          }

          // Log successful login
          db.run(
            'INSERT INTO security_logs (user_id, action, ip_address, user_agent, status, details) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, 'LOGIN', req.ip, req.headers['user-agent'], 'SUCCESS', 'Login successful'],
            (logErr) => {
              if (logErr) console.error('Error logging security event:', logErr);
            }
          );

          // Setup session
          req.session.userId = user.id;
          req.session.username = user.username;
          req.session.email = user.email;
          
          // Set cookie for token
          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure in production
            sameSite: 'strict',
            maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 24 hours
          };
          
          res.cookie('token', token, cookieOptions);

          // Return success with user info (excluding password)
          const { password, ...userWithoutPassword } = user;
          res.json({
            message: 'Login successful',
            user: userWithoutPassword
          });
        }
      );
    } catch (error) {
      console.error('Login error:', error);
      
      // Log error
      db.run(
        'INSERT INTO security_logs (user_id, action, ip_address, status, details) VALUES (?, ?, ?, ?, ?)',
        [user.id, 'LOGIN', req.ip, 'ERROR', `Server error: ${error.message}`],
        (logErr) => {
          if (logErr) console.error('Error logging security event:', logErr);
        }
      );
      
      res.status(500).json({ message: 'Server error during login' });
    }
  });
});

// Logout
router.post('/logout', (req, res) => {
  try {
    // If user is logged in, log the logout event
    if (req.session && req.session.userId) {
      db.run(
        'INSERT INTO security_logs (user_id, action, ip_address, status, details) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, 'LOGOUT', req.ip, 'SUCCESS', 'User logged out'],
        (logErr) => {
          if (logErr) console.error('Error logging security event:', logErr);
        }
      );
    }

    // Clear cookie and session
    res.clearCookie('token');
    req.session.destroy(err => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: 'Error during logout' });
      }
      
      res.json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// Update user profile
router.post('/profile/update', isAuthenticated, [
  check('fullName').optional().trim(),
  check('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  check('confirmNewPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(error => error.msg) });
  }

  const { fullName, currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  // Start building query and parameters
  let query = 'UPDATE users SET';
  const params = [];
  let updateFields = [];

  // Handle fullName update
  if (fullName !== undefined) {
    updateFields.push(' fullName = ?');
    params.push(fullName);
    
    // Also update encrypted version
    updateFields.push(' encryptedFullName = ?');
    params.push(fullName ? encrypt(fullName) : null);
  }

  // Handle password update
  if (currentPassword && newPassword) {
    // First verify current password
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error updating profile' });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      try {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and last_password_change fields
        db.run(
          'UPDATE users SET password = ?, last_password_change = CURRENT_TIMESTAMP WHERE id = ?',
          [hashedPassword, userId],
          function(err) {
            if (err) {
              console.error('Error updating password:', err);
              return res.status(500).json({ message: 'Failed to update password' });
            }

            // Log security event
            db.run(
              'INSERT INTO security_logs (user_id, action, ip_address, status, details) VALUES (?, ?, ?, ?, ?)',
              [userId, 'PASSWORD_CHANGE', req.ip, 'SUCCESS', 'Password changed'],
              (logErr) => {
                if (logErr) console.error('Error logging security event:', logErr);
              }
            );

            res.json({ message: 'Password updated successfully' });
          }
        );
      } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ message: 'Server error updating password' });
      }
    });
  } 
  // Handle only profile updates (if no password change)
  else if (updateFields.length > 0) {
    // Complete the query
    query += updateFields.join(',');
    query += ' WHERE id = ?';
    params.push(userId);

    // Execute update
    db.run(query, params, function(err) {
      if (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ message: 'Failed to update profile' });
      }

      // Log security event
      db.run(
        'INSERT INTO security_logs (user_id, action, ip_address, status, details) VALUES (?, ?, ?, ?, ?)',
        [userId, 'PROFILE_UPDATE', req.ip, 'SUCCESS', 'Profile information updated'],
        (logErr) => {
          if (logErr) console.error('Error logging security event:', logErr);
        }
      );

      res.json({ message: 'Profile updated successfully' });
    });
  }
  else {
    // No changes requested
    res.json({ message: 'No changes made to profile' });
  }
});

// Get user's policies
router.get('/user/policies', isAuthenticated, (req, res) => {
  db.all(
    'SELECT * FROM policies WHERE user_id = ? ORDER BY created_at DESC',
    [req.session.userId],
    (err, policies) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error fetching policies' });
      }

      // Transform policy data if needed
      const processedPolicies = policies.map(policy => {
        const policyData = {
          id: policy.policy_id,
          title: `Privacy Policy for ${policy.website_name}`,
          websiteName: policy.website_name,
          companyName: policy.company_name,
          policyText: policy.policy_text,
          created: policy.created_at
        };

        return policyData;
      });

      res.json({ policies: processedPolicies });
    }
  );
});

module.exports = router;