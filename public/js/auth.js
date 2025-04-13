/**
 * Privacy Policy Generator - Authentication Module (Client-side Version)
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded - initializing auth functions');
  checkUrlMessages();
  setupAuthForms();
  
  // Make sure navigation is updated when the page loads
  updateNavigation();
  
  // Add event listeners for navigation links to ensure consistent navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
      // Make sure navigation gets updated after page loads
      sessionStorage.setItem('updateNavOnLoad', 'true');
    });
  });
  
  // Check if we need to update navigation (from session storage)
  if (sessionStorage.getItem('updateNavOnLoad') === 'true') {
    updateNavigation();
    sessionStorage.removeItem('updateNavOnLoad');
  }
});

/**
 * Set up authentication form event listeners
 */
function setupAuthForms() {
  // Registration form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (!validateRegisterForm()) {
        return;
      }
      
      const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        fullName: document.getElementById('fullName')?.value || ''
      };
      
      registerUser(userData)
        .then(user => {
          // Show success message
          showSuccessMessage('Registration successful! You can now log in.');
          
          // Redirect to login page after a delay
          setTimeout(() => {
            window.location.href = 'login.html?message=Registration successful! You can now log in.&type=success';
          }, 1500);
        })
        .catch(error => {
          // Show error message
          showErrorMessage(error.message || 'Registration failed. Please try again.');
        });
    });
  }
  
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (!validateLoginForm()) {
        return;
      }
      
      const loginData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        rememberMe: document.getElementById('rememberMe')?.checked || false
      };
      
      loginUser(loginData)
        .then(result => {
          showSuccessMessage('Login successful! Redirecting to dashboard...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1000);
        })
        .catch(error => {
          showErrorMessage(error.message || 'Login failed. Please check your credentials.');
        });
    });
  }
  
  // Setup password toggles
  setupPasswordToggles();
}

/**
 * Toggle password visibility for password fields
 */
function setupPasswordToggles() {
  const toggleBtns = document.querySelectorAll('.toggle-password');
  
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      if (input) {
        // Toggle type between password and text
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        // Toggle icon
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
      }
    });
  });
}

/**
 * Validate the registration form input
 * @returns {boolean} Whether the form is valid
 */
function validateRegisterForm() {
  const username = document.getElementById('username');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  let isValid = true;
  
  // Clear previous error messages
  clearErrors();
  
  // Check if elements exist before validating them
  if (!username) {
    console.error('Username field not found in the form');
    isValid = false;
  } else if (username.value.trim().length < 3) {
    showInputError(username, 'Username must be at least 3 characters');
    isValid = false;
  }
  
  if (!email) {
    console.error('Email field not found in the form');
    isValid = false;
  } else if (!isEmailValid(email.value)) {
    showInputError(email, 'Please enter a valid email address');
    isValid = false;
  }
  
  if (!password) {
    console.error('Password field not found in the form');
    isValid = false;
  } else if (password.value.length < 6) {
    showInputError(password, 'Password must be at least 6 characters');
    isValid = false;
  }
  
  if (!confirmPassword) {
    console.error('Confirm password field not found in the form');
    isValid = false;
  } else if (password && confirmPassword.value !== password.value) {
    showInputError(confirmPassword, 'Passwords do not match');
    isValid = false;
  }
  
  return isValid;
}

/**
 * Validate the login form input
 * @returns {boolean} Whether the form is valid
 */
function validateLoginForm() {
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  let isValid = true;
  
  // Clear previous error messages
  clearErrors();
  
  if (!email || !isEmailValid(email.value)) {
    showInputError(email, 'Please enter a valid email address');
    isValid = false;
  }
  
  if (!password || password.value.trim() === '') {
    showInputError(password, 'Please enter your password');
    isValid = false;
  }
  
  return isValid;
}

/**
 * Display an error message for a specific input
 * @param {HTMLElement} input - The input element
 * @param {string} message - Error message to display
 */
function showInputError(input, message) {
  // Find the parent form-group
  const formGroup = input.closest('.form-group');
  if (!formGroup) return;
  
  // Create error message element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'invalid-feedback d-block';
  errorDiv.textContent = message;
  
  // Add error class to input
  input.classList.add('is-invalid');
  
  // Add error message after the input
  formGroup.appendChild(errorDiv);
}

/**
 * Clear all error messages from a form
 */
function clearErrors() {
  // Remove all error messages
  document.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
  
  // Remove error styling from inputs
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

/**
 * Validate an email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} Whether the email is valid
 */
function isEmailValid(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Show an alert message
 * @param {string} message - Message to display
 * @param {string} type - Alert type (success, danger, warning, info)
 * @param {string} containerId - ID of container to add alert to
 */
function showAlert(message, type = 'danger', containerId = 'alertContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Create alert element
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Add to container
  container.innerHTML = '';
  container.appendChild(alert);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    alert.classList.remove('show');
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

/**
 * Check URL for message parameters and display them
 */
function checkUrlMessages() {
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get('message');
  const type = urlParams.get('type') || 'info';
  
  if (message) {
    showAlert(message, type);
    
    // Clean URL (remove query parameters)
    const url = new URL(window.location);
    url.searchParams.delete('message');
    url.searchParams.delete('type');
    window.history.replaceState({}, '', url);
  }
}

/**
 * Encrypt data using AES encryption (for client-side)
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Encrypted data
 */
function encryptData(data, key) {
  try {
    // Generate salt and IV for better security
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const iv = CryptoJS.lib.WordArray.random(128/8);
    
    // Derive key using PBKDF2
    const derivedKey = CryptoJS.PBKDF2(
      key || 'default-key-change-in-production', 
      salt, 
      { keySize: 256/32, iterations: 1000 }
    );
    
    // Encrypt with AES-CBC
    const encrypted = CryptoJS.AES.encrypt(data, derivedKey, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    
    // Combine salt, IV, and ciphertext for storage
    return salt.toString() + iv.toString() + encrypted.toString();
  } catch (e) {
    console.error('Encryption error:', e);
    return '';
  }
}

/**
 * Password strength meter
 * @param {string} password - Password to check
 * @returns {number} Strength score (0-100)
 */
function checkPasswordStrength(password) {
  let score = 0;
  
  // Length
  if (password.length >= 8) score += 25;
  else if (password.length >= 6) score += 10;
  
  // Complexity
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  
  // Variety
  const uniqueChars = new Set(password).size;
  score += Math.min(15, uniqueChars * 2);
  
  return Math.min(100, score);
}

// If password strength meter exists, set up the event listener
document.addEventListener('DOMContentLoaded', function() {
  const passwordInput = document.getElementById('password');
  const strengthMeter = document.getElementById('passwordStrength');
  
  if (passwordInput && strengthMeter) {
    passwordInput.addEventListener('input', function() {
      const strength = checkPasswordStrength(this.value);
      
      // Update meter value
      strengthMeter.value = strength;
      
      // Update color
      if (strength < 30) {
        strengthMeter.className = 'password-strength-meter very-weak';
      } else if (strength < 50) {
        strengthMeter.className = 'password-strength-meter weak';
      } else if (strength < 75) {
        strengthMeter.className = 'password-strength-meter medium';
      } else {
        strengthMeter.className = 'password-strength-meter strong';
      }
      
      // Update text
      const strengthText = document.getElementById('passwordStrengthText');
      if (strengthText) {
        if (strength < 30) {
          strengthText.textContent = 'Very Weak';
          strengthText.className = 'text-danger';
        } else if (strength < 50) {
          strengthText.textContent = 'Weak';
          strengthText.className = 'text-warning';
        } else if (strength < 75) {
          strengthText.textContent = 'Medium';
          strengthText.className = 'text-info';
        } else {
          strengthText.textContent = 'Strong';
          strengthText.className = 'text-success';
        }
      }
    });
  }
});

/**
 * Register a new user
 * @param {Object} userData - User data including username, email, and password
 * @returns {Promise} Promise that resolves with the user data or rejects with an error
 */
function registerUser(userData) {
  return new Promise((resolve, reject) => {
    try {
      // Validate required fields first
      if (!userData.username || !userData.email || !userData.password) {
        return reject(new Error('Username, email and password are required'));
      }
      
      // Get existing users or create empty array
      const users = JSON.parse(localStorage.getItem('users')) || [];
      
      // Check if username exists (with null safety)
      if (users.some(user => user.username && userData.username && 
          user.username.toLowerCase() === userData.username.toLowerCase())) {
        return reject(new Error('Username already exists'));
      }
      
      // Check if email exists (with null safety)
      if (users.some(user => user.email && userData.email &&
          user.email.toLowerCase() === userData.email.toLowerCase())) {
        return reject(new Error('Email already exists'));
      }
      
      // Generate salt for better security (this is clientside so not as secure as server-side bcrypt)
      const salt = CryptoJS.lib.WordArray.random(128/8).toString();
      
      // Create new user object
      const newUser = {
        id: Date.now().toString(), // Use timestamp as ID
        username: userData.username,
        email: userData.email,
        // Hash the password with salted SHA-256 (in a real app, this would be done server-side with bcrypt)
        password: CryptoJS.SHA256(userData.password + salt).toString(),
        salt: salt, // Store salt for verification
        // Encrypt sensitive data
        encryptedEmail: encryptData(userData.email, process.env.ENCRYPTION_KEY || 'default-key-change-in-production'),
        encryptedUsername: encryptData(userData.username, process.env.ENCRYPTION_KEY || 'default-key-change-in-production'),
        encryptedFullName: userData.fullName ? encryptData(userData.fullName, process.env.ENCRYPTION_KEY || 'default-key-change-in-production') : null,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        policies: []
      };
      
      // Add user to array
      users.push(newUser);
      
      // Save to localStorage
      localStorage.setItem('users', JSON.stringify(users));
      
      // Return success (exclude password and salt from returned user)
      const { password, salt, ...userWithoutPassword } = newUser;
      resolve(userWithoutPassword);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Log in a user
 * @param {Object} credentials - User credentials (email and password)
 * @returns {Promise} Promise that resolves with user data or rejects with an error
 */
function loginUser(credentials) {
  return new Promise((resolve, reject) => {
    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users')) || [];
      
      // Find user by email (case insensitive)
      const user = users.find(
        u => u.email.toLowerCase() === credentials.email.toLowerCase()
      );
      
      // If user not found
      if (!user) {
        return reject(new Error('Invalid email or password'));
      }
      
      // Verify password using the stored salt for better security
      const hashedPassword = CryptoJS.SHA256(credentials.password + (user.salt || '')).toString();
      if (user.password !== hashedPassword) {
        return reject(new Error('Invalid email or password'));
      }
      
      // Update last login
      user.last_login = new Date().toISOString();
      
      // Save updated user data
      localStorage.setItem('users', JSON.stringify(users));
      
      // Store user ID in sessionStorage for authentication
      sessionStorage.setItem('userId', user.id);
      
      // If "remember me" is checked, store in localStorage (30 days)
      if (credentials.rememberMe) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        localStorage.setItem('rememberMe', JSON.stringify({
          userId: user.id,
          expiry: expiry.toISOString()
        }));
      }
      
      // Return user data (without password and salt)
      const { password, salt, ...userWithoutPassword } = user;
      resolve(userWithoutPassword);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Log out the current user
 */
function logout() {
  // Clear session data
  sessionStorage.removeItem('userId');
  localStorage.removeItem('rememberMe');
  
  // Redirect to login page
  window.location.href = 'login.html?message=You have been logged out&type=success';
}

/**
 * Check if a user is currently logged in
 * @returns {Promise} Promise that resolves with user data if logged in or null if not
 */
function checkAuthStatus() {
  return new Promise((resolve) => {
    // Check for user ID in sessionStorage first
    let userId = sessionStorage.getItem('userId');
    
    // If not found, check for remembered login in localStorage
    if (!userId) {
      const remembered = JSON.parse(localStorage.getItem('rememberMe'));
      
      if (remembered) {
        // Check if the remembered login hasn't expired
        const expiry = new Date(remembered.expiry);
        const now = new Date();
        
        if (expiry > now) {
          userId = remembered.userId;
          sessionStorage.setItem('userId', userId); // Restore the session
        } else {
          // If expired, clear the remembered login
          localStorage.removeItem('rememberMe');
        }
      }
    }
    
    // If still no userId, user is not logged in
    if (!userId) {
      return resolve(null);
    }
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Find the current user
    const currentUser = users.find(user => user.id === userId);
    
    // If user not found, clear session and return null
    if (!currentUser) {
      sessionStorage.removeItem('userId');
      return resolve(null);
    }
    
    // Return user data (without password)
    const { password, ...userWithoutPassword } = currentUser;
    resolve(userWithoutPassword);
  });
}

/**
 * Get user's saved policies
 * @returns {Promise} Promise that resolves with an array of user's policies
 */
function getUserPolicies() {
  return new Promise((resolve, reject) => {
    checkAuthStatus()
      .then(user => {
        if (!user) {
          return reject(new Error('User not authenticated'));
        }
        
        // In this client-side version, policies are stored directly in the user object
        resolve(user.policies || []);
      })
      .catch(reject);
  });
}

/**
 * Save a policy to the user's account
 * @param {Object} policy - The policy to save
 * @returns {Promise} Promise that resolves when the policy is saved
 */
function savePolicy(policy) {
  return new Promise((resolve, reject) => {
    checkAuthStatus()
      .then(user => {
        if (!user) {
          return reject(new Error('User not authenticated'));
        }
        
        // Get all users
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Find the current user's index
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex === -1) {
          return reject(new Error('User not found'));
        }
        
        // Add policy to user's policies
        if (!users[userIndex].policies) {
          users[userIndex].policies = [];
        }
        
        // Check if policy already exists (by ID)
        const existingPolicyIndex = users[userIndex].policies.findIndex(
          p => p.id === policy.id
        );
        
        if (existingPolicyIndex !== -1) {
          // Update existing policy
          users[userIndex].policies[existingPolicyIndex] = {
            ...policy,
            updated_at: new Date().toISOString()
          };
        } else {
          // Add new policy
          users[userIndex].policies.push({
            ...policy,
            created_at: new Date().toISOString()
          });
        }
        
        // Save updated users back to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        resolve(true);
      })
      .catch(reject);
  });
}

/**
 * Delete a user's policy
 * @param {string} policyId The ID of the policy to delete
 * @returns {Promise<Object>} Promise resolving to deletion result
 */
function deletePolicy(policyId) {
  return new Promise((resolve, reject) => {
    if (!policyId) {
      return reject(new Error('Policy ID is required'));
    }
    
    checkAuthStatus()
      .then(user => {
        if (!user) {
          return reject(new Error('User not authenticated'));
        }
        
        // For API-based implementation
        fetch(`/api/delete/${policyId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin'
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(errData => {
              throw new Error(errData.message || 'Error deleting policy');
            });
          }
          return response.json();
        })
        .then(data => {
          resolve(data);
        })
        .catch(error => {
          console.error('API delete policy error:', error);
          
          // Fallback to client-side implementation
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const userIndex = users.findIndex(u => u.id === user.id);
          
          if (userIndex === -1) {
            return reject(new Error('User not found'));
          }
          
          const policyIndex = users[userIndex].policies.findIndex(p => p.id === policyId);
          
          if (policyIndex === -1) {
            return reject(new Error('Policy not found'));
          }
          
          // Remove the policy
          users[userIndex].policies.splice(policyIndex, 1);
          localStorage.setItem('users', JSON.stringify(users));
          
          // Also update current user in sessionStorage
          const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
          if (currentUser && currentUser.id === user.id) {
            currentUser.policies = users[userIndex].policies;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
          }
          
          resolve({ success: true, message: 'Policy deleted successfully' });
        });
      })
      .catch(reject);
  });
}

/**
 * Update user profile
 * @param {Object} profileData - The profile data to update
 * @returns {Promise} Promise that resolves when the profile is updated
 */
function updateUserProfile(profileData) {
  return new Promise((resolve, reject) => {
    checkAuthStatus()
      .then(user => {
        if (!user) {
          return reject(new Error('User not authenticated'));
        }
        
        // Get all users
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Find the current user's index
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex === -1) {
          return reject(new Error('User not found'));
        }
        
        // Update allowed fields
        if (profileData.fullName !== undefined) {
          users[userIndex].fullName = profileData.fullName;
        }
        
        // Save updated users back to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        // Return updated user (without password)
        const { password, ...updatedUser } = users[userIndex];
        resolve(updatedUser);
      })
      .catch(reject);
  });
}

/**
 * Update user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} Promise that resolves when the password is updated
 */
function updatePassword(currentPassword, newPassword) {
  return new Promise((resolve, reject) => {
    checkAuthStatus()
      .then(user => {
        if (!user) {
          return reject(new Error('User not authenticated'));
        }
        
        // Get all users
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Find the current user's index
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex === -1) {
          return reject(new Error('User not found'));
        }
        
        // Verify current password using stored salt
        const hashedCurrentPassword = CryptoJS.SHA256(currentPassword + (users[userIndex].salt || '')).toString();
        if (users[userIndex].password !== hashedCurrentPassword) {
          return reject(new Error('Current password is incorrect'));
        }
        
        // Generate new salt for the new password
        const newSalt = CryptoJS.lib.WordArray.random(128/8).toString();
        
        // Update password with new salt
        users[userIndex].password = CryptoJS.SHA256(newPassword + newSalt).toString();
        users[userIndex].salt = newSalt;
        users[userIndex].last_password_change = new Date().toISOString();
        
        // Save updated users back to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        resolve(true);
      })
      .catch(reject);
  });
}

/**
 * Simple password hashing (for demo purposes)
 * In a real app, use a proper server-side hashing algorithm
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Promise resolving to hashed password
 */
async function hashPassword(password) {
  // This is a very simplified hash for demo purposes only!
  // In a real app, use bcrypt or similar on the server side
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'some-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} - Promise resolving to verification result
 */
async function verifyPassword(password, hash) {
  const calculatedHash = await hashPassword(password);
  return calculatedHash === hash;
}

/**
 * Show success message in the UI
 * @param {string} message - Message to display
 */
function showSuccessMessage(message) {
  const successAlert = document.getElementById('successAlert') || document.getElementById('loginSuccessAlert');
  if (successAlert) {
    successAlert.textContent = message;
    successAlert.classList.remove('d-none');
    
    setTimeout(() => {
      successAlert.classList.add('d-none');
    }, 5000);
  }
}

/**
 * Show error message in the UI
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  const errorAlert = document.getElementById('errorAlert') || document.getElementById('loginErrorAlert');
  if (errorAlert) {
    errorAlert.textContent = message;
    errorAlert.classList.remove('d-none');
    
    setTimeout(() => {
      errorAlert.classList.add('d-none');
    }, 5000);
  }
}

/**
 * Set up navigation event handlers to ensure consistent navigation behavior
 */
function setupNavigationHandlers() {
  // Handle home/dashboard navigation links
  const homeLinks = document.querySelectorAll('a[href="index.html"], a[href="./index.html"], a[href="/"], a[href="./"], a[href="dashboard.html"], .home-link, .dashboard-link');
  
  homeLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      navigateToHome();
    });
  });
  
  // Check if we need to redirect based on auth status
  const currentPath = window.location.pathname;
  const protectedPages = ['dashboard.html', 'profile.html', 'create-policy.html', 'edit-policy.html', 'my-policies.html'];
  const publicPages = ['login.html', 'register.html'];
  
  const isProtectedPage = protectedPages.some(page => currentPath.includes(page));
  const isPublicPage = publicPages.some(page => currentPath.includes(page));
  
  // If user is on any page, adjust UI based on auth status
  checkAuthStatus().then(user => {
    // Select the main header and auth-related elements
    const mainHeader = document.getElementById('main-header');
    const authButtons = document.querySelectorAll('.auth-buttons');
    const profileTab = document.querySelector('.profile-tab');
    const userMenu = document.querySelector('.user-menu');
    const usernamePlaceholder = document.querySelector('.username-placeholder');
    
    if (user) {
      // User is logged in
      
      // Show profile tab
      if (profileTab) {
        profileTab.classList.remove('d-none');
      }
      
      // Update username if element exists
      if (usernamePlaceholder) {
        usernamePlaceholder.textContent = user.username;
      }
      
      // Show user menu and hide auth buttons
      if (userMenu) userMenu.classList.remove('d-none');
      authButtons.forEach(btn => btn.classList.add('d-none'));
      
    } else {
      // User is not logged in
      
      // Hide profile tab
      if (profileTab) {
        profileTab.classList.add('d-none');
      }
      
      // Hide user menu and show auth buttons
      if (userMenu) userMenu.classList.add('d-none');
      authButtons.forEach(btn => btn.classList.remove('d-none'));
    }
  });
  
  // Redirect for protected pages if not authenticated
  if (isProtectedPage) {
    ensureAuthenticated();
  }
}

/**
 * Navigate to the appropriate home page based on authentication status
 */
function navigateToHome() {
  checkAuthStatus()
    .then(user => {
      if (user) {
        // User is logged in, navigate to dashboard
        window.location.href = 'dashboard.html';
      } else {
        // User is not logged in, navigate to index page
        window.location.href = 'index.html';
      }
    })
    .catch(() => {
      // In case of error, default to index page
      window.location.href = 'index.html';
    });
}

/**
 * Ensure the user is authenticated, redirect to login if not
 */
function ensureAuthenticated() {
  checkAuthStatus()
    .then(user => {
      if (!user) {
        // If not authenticated and on a protected page, redirect to login
        window.location.href = 'login.html?message=Please log in to access this page&type=info';
      }
    })
    .catch(() => {
      // In case of error, redirect to login
      window.location.href = 'login.html?message=Authentication error occurred&type=warning';
    });
}

/**
 * Update navigation bar based on authentication status
 */
function updateNavigation() {
  console.log('Updating navigation...');
  checkAuthStatus()
    .then(user => {
      const navbarLinks = document.getElementById('navbarLinks');
      
      if (!navbarLinks) {
        console.error('Navigation container not found! (navbarLinks)');
        return;
      }
      
      console.log('Navigation container found, updating links');
      console.log('User authenticated:', !!user);
      
      // Clear existing links
      navbarLinks.innerHTML = '';
      
      if (user) {
        // User is logged in - show authenticated navigation
        navbarLinks.innerHTML = `
          <li class="nav-item">
            <a class="nav-link" href="./dashboard.html">Dashboard</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="./generate.html">Generate Policy</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="./my-policies.html">My Policies</a>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="fas fa-user-circle me-1"></i><span id="usernameDisplay">${user.username || 'Account'}</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
              <li><a class="dropdown-item" href="./profile.html"><i class="fas fa-user-edit me-2"></i>Profile</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
            </ul>
          </li>
        `;
        
        // Add logout event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
              logout();
            }
          });
        }
      } else {
        // User is not logged in - show guest navigation
        navbarLinks.innerHTML = `
          <li class="nav-item">
            <a class="nav-link" href="./index.html">Home</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="./about.html">About</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="./generate.html">Generate Policy</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="./contact.html">Contact Us</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="./login.html">Login</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="./register.html">Register</a>
          </li>
        `;
      }
      
      // Highlight active page
      highlightActivePage();
    })
    .catch(error => {
      console.error('Error updating navigation:', error);
    });
}

/**
 * Highlight the active page in the navigation
 */
function highlightActivePage() {
  // Get the current page filename
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Find and highlight the active link
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) {
      link.classList.add('active');
      
      // If this is part of a dropdown, also activate the parent dropdown
      const dropdownParent = link.closest('.dropdown');
      if (dropdownParent) {
        const dropdownToggle = dropdownParent.querySelector('.dropdown-toggle');
        if (dropdownToggle) {
          dropdownToggle.classList.add('active');
        }
      }
    } else {
      link.classList.remove('active');
    }
  });
}

// Call updateNavigation when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  checkUrlMessages();
  setupAuthForms();
  updateNavigation();
});

// Export functions if using modules (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    registerUser,
    loginUser,
    logout,
    checkAuthStatus,
    getUserPolicies,
    savePolicy,
    deletePolicy,
    updateUserProfile,
    updatePassword,
    getUserPolicyCount
  };
}

/**
 * Get the user's policy count
 * @returns {Promise<number>} Promise resolving to the count of user's policies
 */
function getUserPolicyCount() {
  return new Promise((resolve, reject) => {
    checkAuthStatus()
      .then(user => {
        if (!user) {
          return reject(new Error('User not authenticated'));
        }
        
        // Get count from user's policies array
        const policyCount = (user.policies || []).length;
        resolve(policyCount);
      })
      .catch(reject);
  });
}