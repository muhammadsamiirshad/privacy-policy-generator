/**
 * Privacy Policy Generator - Authentication Module
 * Handles all authentication-related functionality
 */

// Wait for document to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize auth-related components
  initAuthForms();
  updateNavigationLinks();
  
  // Check for URL parameters
  checkUrlMessages();
});

/**
 * Initialize authentication forms (login and register)
 */
function initAuthForms() {
  // Login form submit handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      if (!loginForm.checkValidity()) {
        e.stopPropagation();
        loginForm.classList.add('was-validated');
        return;
      }
      
      // Clear previous alerts
      hideAlert('loginErrorAlert');
      hideAlert('loginSuccessAlert');
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('rememberMe')?.checked || false;
      
      try {
        // Show loading
        showLoadingSpinner('Signing in...');
        
        // Try client-side login first
        try {
          // Try client-side authentication
          const loginResult = await clientSideLogin(email, password, rememberMe);
          
          // Hide loading
          hideLoadingSpinner();
          
          // Show success message
          showAlert('loginSuccessAlert', 'Login successful! Redirecting to dashboard...');
          
          // Redirect to dashboard after a small delay
          setTimeout(() => {
            window.location.href = './dashboard.html';
          }, 1000);
          
          return;
        } catch (clientError) {
          console.log('Client-side login failed, trying API:', clientError);
          // Continue with API login attempt
        }
        
        // API login fallback
        try {
          // Call login API
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, rememberMe })
          });
          
          const data = await response.json();
          
          // Hide loading
          hideLoadingSpinner();
          
          if (!response.ok) {
            // Display error messages
            const errorMessages = data.errors || [data.message || 'Login failed'];
            showAlert('loginErrorAlert', errorMessages.join('<br>'));
            return;
          }
          
          // Success - show message briefly before redirecting
          showAlert('loginSuccessAlert', 'Login successful! Redirecting to dashboard...');
          
          // Redirect to dashboard after a small delay
          setTimeout(() => {
            window.location.href = './dashboard.html';
          }, 1000);
        } catch (apiError) {
          throw apiError; // Re-throw to be caught by outer catch
        }
      } catch (error) {
        hideLoadingSpinner();
        console.error('Login error:', error);
        showAlert('loginErrorAlert', 'Invalid email or password. Please try again.');
      }
    });
  }
  
  // Register form submit handler
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      if (!registerForm.checkValidity()) {
        e.stopPropagation();
        registerForm.classList.add('was-validated');
        return;
      }
      
      // Clear previous alerts
      hideAlert('errorAlert');
      hideAlert('successAlert');
      
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const fullName = document.getElementById('fullName')?.value.trim() || '';
      const agreeTerms = document.getElementById('agreeTerms').checked;
      
      // Client-side validation
      if (!agreeTerms) {
        showAlert('errorAlert', 'You must agree to the Terms of Service and Privacy Policy');
        return;
      }
      
      if (password !== confirmPassword) {
        showAlert('errorAlert', 'Passwords do not match');
        return;
      }
      
      try {
        // Show loading
        showLoadingSpinner('Creating your account...');
        
        // Try client-side registration first
        try {
          await clientSideRegister({
            username,
            email,
            password,
            fullName
          });
          
          // Hide loading
          hideLoadingSpinner();
          
          // Success - show message
          showAlert('successAlert', 'Registration successful! You can now log in.');
          
          // Clear form
          registerForm.reset();
          registerForm.classList.remove('was-validated');
          
          // Redirect to login page after delay
          setTimeout(() => {
            window.location.href = './login.html?message=Registration successful! You can now log in.&type=success';
          }, 2000);
          
          return;
        } catch (clientError) {
          console.log('Client-side registration failed, trying API:', clientError);
          // Continue with API registration attempt
        }
        
        // API registration fallback
        try {
          // Call register API
          const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username,
              email,
              password,
              confirmPassword,
              fullName,
            })
          });
          
          const data = await response.json();
          
          // Hide loading
          hideLoadingSpinner();
          
          if (!response.ok) {
            // Display error messages
            const errorMessages = data.errors || [data.message || 'Registration failed'];
            showAlert('errorAlert', errorMessages.join('<br>'));
            return;
          }
          
          // Success - show message and redirect to login page after delay
          showAlert('successAlert', data.message || 'Registration successful! You can now log in.');
          
          // Clear form
          registerForm.reset();
          registerForm.classList.remove('was-validated');
          
          // Redirect to login page after delay
          setTimeout(() => {
            window.location.href = './login.html?message=Registration successful! You can now log in.&type=success';
          }, 2000);
        } catch (apiError) {
          throw apiError; // Re-throw to be caught by outer catch
        }
      } catch (error) {
        hideLoadingSpinner();
        console.error('Registration error:', error);
        showAlert('errorAlert', 'An error occurred during registration. Please try again.');
      }
    });
  }
  
  // Profile form handler
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      if (!profileForm.checkValidity()) {
        e.stopPropagation();
        profileForm.classList.add('was-validated');
        return;
      }
      
      // Clear previous alerts
      hideAlert('errorAlert');
      hideAlert('successAlert');
      
      const fullName = document.getElementById('fullName')?.value.trim() || '';
      const currentPassword = document.getElementById('currentPassword')?.value || '';
      const newPassword = document.getElementById('newPassword')?.value || '';
      const confirmNewPassword = document.getElementById('confirmNewPassword')?.value || '';
      
      // Build update data
      const updateData = { fullName };
      
      // Add password change data if any password field is filled
      if (currentPassword || newPassword || confirmNewPassword) {
        // Validate all password fields are filled
        if (!currentPassword || !newPassword || !confirmNewPassword) {
          showAlert('errorAlert', 'All password fields must be filled to change password');
          return;
        }
        
        // Check new passwords match
        if (newPassword !== confirmNewPassword) {
          showAlert('errorAlert', 'New passwords do not match');
          return;
        }
        
        // Add to update data
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
        updateData.confirmNewPassword = confirmNewPassword;
      }
      
      try {
        // Show loading
        showLoadingSpinner('Updating profile...');
        
        const response = await fetch('/api/profile/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        // Hide loading
        hideLoadingSpinner();
        
        if (!response.ok) {
          // Display error messages
          const errorMessages = data.errors || [data.message || 'Update failed'];
          showAlert('errorAlert', errorMessages.join('<br>'));
          return;
        }
        
        // Success
        showAlert('successAlert', data.message || 'Profile updated successfully!');
        
        // Clear password fields but keep full name
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        
      } catch (error) {
        hideLoadingSpinner();
        console.error('Profile update error:', error);
        showAlert('errorAlert', 'An error occurred during profile update. Please try again.');
      }
    });
  }
}

/**
 * Client-side login implementation
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {boolean} rememberMe - Whether to remember the login
 * @returns {Promise<Object>} Promise that resolves with user data
 */
async function clientSideLogin(email, password, rememberMe) {
  return new Promise((resolve, reject) => {
    try {
      // Load users from localStorage
      const users = JSON.parse(localStorage.getItem('users')) || [];
      
      // Find user by email (case insensitive)
      const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      
      // If user not found
      if (!user) {
        return reject(new Error('Invalid email or password'));
      }
      
      // For demo purposes, we'll use a simple password check
      // In a real application, you'd use proper hashing
      if (user.password !== password) {
        return reject(new Error('Invalid email or password'));
      }
      
      // Update last login
      user.last_login = new Date().toISOString();
      localStorage.setItem('users', JSON.stringify(users));
      
      // Create a sanitized user object without sensitive data
      const { password: pwd, ...safeUser } = user;
      
      // Store user ID in session storage for current session
      sessionStorage.setItem('userId', user.id);
      
      // If remember me, store in localStorage for persistent login
      if (rememberMe) {
        localStorage.setItem('rememberedUser', user.id);
      }
      
      resolve(safeUser);
    } catch (error) {
      console.error('Client-side login error:', error);
      reject(error);
    }
  });
}

/**
 * Client-side register implementation
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Promise that resolves with new user data
 */
async function clientSideRegister(userData) {
  return new Promise((resolve, reject) => {
    try {
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        return reject(new Error('Username, email and password are required'));
      }
      
      // Load existing users
      const users = JSON.parse(localStorage.getItem('users')) || [];
      
      // Check if username exists
      if (users.find(u => u.username && u.username.toLowerCase() === userData.username.toLowerCase())) {
        return reject(new Error('Username already exists'));
      }
      
      // Check if email exists
      if (users.find(u => u.email && u.email.toLowerCase() === userData.email.toLowerCase())) {
        return reject(new Error('Email already exists'));
      }
      
      // Create new user object
      const newUser = {
        id: Date.now().toString(), // Use timestamp as ID
        username: userData.username,
        email: userData.email,
        password: userData.password, // In a real app, you'd hash this
        fullName: userData.fullName || '',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        policies: []
      };
      
      // Add to users array
      users.push(newUser);
      
      // Save to localStorage
      localStorage.setItem('users', JSON.stringify(users));
      
      // Return success (exclude password from returned user)
      const { password, ...safeUser } = newUser;
      resolve(safeUser);
    } catch (error) {
      console.error('Client-side registration error:', error);
      reject(error);
    }
  });
}

/**
 * Check authentication status of current user
 * @returns {Promise<Object|null>} User object if authenticated, null otherwise
 */
async function checkAuthStatus() {
  return new Promise((resolve) => {
    try {
      console.log('Checking authentication status...');
      
      // First check sessionStorage for current session
      let userId = sessionStorage.getItem('userId');
      
      // If not found, check localStorage for remembered login
      if (!userId) {
        userId = localStorage.getItem('rememberedUser');
        // If found, restore to session storage
        if (userId) {
          console.log('Found remembered user, restoring session');
          sessionStorage.setItem('userId', userId);
        }
      }
      
      if (!userId) {
        console.log('No user ID found, not authenticated');
        return resolve(null);
      }
      
      console.log('User ID found:', userId);
      
      // Get all users and find the current one
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const currentUser = users.find(user => user.id === userId);
      
      if (!currentUser) {
        console.log('User not found in stored users');
        // Clear potentially invalid stored IDs
        sessionStorage.removeItem('userId');
        localStorage.removeItem('rememberedUser');
        return resolve(null);
      }
      
      console.log('User authenticated:', currentUser.username);
      
      // Return user data without sensitive fields
      const { password, ...userWithoutSensitive } = currentUser;
      resolve(userWithoutSensitive);
    } catch (error) {
      console.error('Error checking auth status:', error);
      resolve(null);
    }
  });
}

/**
 * Get user's policies
 * @returns {Promise<Array>} Array of user's policies
 */
async function getUserPolicies() {
  try {
    // Check if user is authenticated
    const user = await checkAuthStatus();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get policies from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const currentUser = users.find(user => user.id === sessionStorage.getItem('userId'));
    
    if (!currentUser) {
      return [];
    }
    
    // Return user's policies (ensure it's always an array)
    return currentUser.policies || [];
  } catch (error) {
    console.error('Error getting user policies:', error);
    throw error; // Re-throw for handling in calling code
  }
}

/**
 * Save a policy to user's account
 * @param {Object} policyData - The policy data to save
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function savePolicy(policyData) {
  try {
    // Check if user is authenticated
    const user = await checkAuthStatus();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get all users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Initialize policies array if it doesn't exist
    if (!users[userIndex].policies) {
      users[userIndex].policies = [];
    }
    
    // Check if policy already exists (update it) or add new one
    const existingPolicyIndex = users[userIndex].policies.findIndex(p => p.id === policyData.id);
    
    if (existingPolicyIndex !== -1) {
      // Update existing policy
      users[userIndex].policies[existingPolicyIndex] = {
        ...policyData,
        updated_at: new Date().toISOString()
      };
    } else {
      // Add new policy
      users[userIndex].policies.push({
        ...policyData,
        created_at: new Date().toISOString()
      });
    }
    
    // Save updated users to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    console.log('Policy saved successfully:', policyData.id);
    return true;
  } catch (error) {
    console.error('Error saving policy:', error);
    throw error; // Re-throw for handling in calling code
  }
}

/**
 * Delete a policy from user's account
 * @param {string} policyId - The ID of the policy to delete
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function deletePolicy(policyId) {
  try {
    // First check if user is authenticated
    const user = await checkAuthStatus();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get all users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Find the policy index
    const policyIndex = users[userIndex].policies ? 
      users[userIndex].policies.findIndex(p => p.id === policyId) : -1;
    
    if (policyIndex === -1) {
      throw new Error('Policy not found');
    }
    
    // Remove the policy
    users[userIndex].policies.splice(policyIndex, 1);
    
    // Save updated users back to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    return true;
  } catch (error) {
    console.error('Error deleting policy:', error);
    throw error; // Re-throw for handling in calling code
  }
}

/**
 * Logout the current user
 */
async function logout() {
  try {
    showLoadingSpinner('Logging out...');
    
    // Clear session storage
    sessionStorage.removeItem('userId');
    // Clear remembered login
    localStorage.removeItem('rememberedUser');
    
    hideLoadingSpinner();
    
    // Redirect to login page
    window.location.href = './login.html?message=You have been logged out&type=info';
  } catch (error) {
    hideLoadingSpinner();
    console.error('Logout error:', error);
    window.location.href = './login.html?message=Error during logout&type=error';
  }
}

/**
 * Update navigation links based on auth status
 */
async function updateNavigationLinks() {
  const navbarLinks = document.getElementById('navbarLinks');
  if (!navbarLinks) return;
  
  try {
    // Check auth status
    const user = await checkAuthStatus();
    
    if (user) {
      // User is authenticated - show logged-in links
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
          <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fas fa-user-circle me-1"></i>${user.username}
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="./profile.html"><i class="fas fa-id-card me-2"></i>Profile</a></li>
            <li><a class="dropdown-item" href="./my-policies.html"><i class="fas fa-file-alt me-2"></i>My Policies</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
          </ul>
        </li>
      `;
      
      // Set up logout button
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function(event) {
          event.preventDefault();
          logout();
        });
      }
      
    } else {
      // User is not authenticated - show guest links
      navbarLinks.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="./index.html">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="./generate.html">Generate Policy</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="./about.html">About</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="./contact.html">Contact</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="./login.html">Login</a>
        </li>
        <li class="nav-item">
          <a class="nav-link btn btn-outline-light btn-sm ms-2" href="./register.html">Register</a>
        </li>
      `;
    }
    
    // Check for current page and highlight active link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = navbarLinks.querySelectorAll('.nav-link');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes(currentPage)) {
        link.classList.add('active');
      }
    });
    
  } catch (error) {
    console.error('Error updating navigation links:', error);
    // Show default guest navigation in case of error
    navbarLinks.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="./index.html">Home</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="./generate.html">Generate Policy</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="./login.html">Login</a>
      </li>
      <li class="nav-item">
        <a class="nav-link btn btn-outline-light btn-sm ms-2" href="./register.html">Register</a>
      </li>
    `;
  }
}

/**
 * Check URL for message and type parameters for alerts
 */
function checkUrlMessages() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('message')) {
    const message = urlParams.get('message');
    const type = urlParams.get('type') || 'info';
    
    // Different alert elements for different pages
    const alertIds = ['successAlert', 'errorAlert', 'infoAlert', 'loginSuccessAlert', 'loginErrorAlert'];
    
    for (const alertId of alertIds) {
      if (document.getElementById(alertId)) {
        if ((type === 'success' && alertId.includes('Success')) || 
            (type === 'error' && alertId.includes('Error')) || 
            (alertId === 'infoAlert')) {
          showAlert(alertId, message);
          break;
        }
      }
    }
    
    // Remove the URL parameters to prevent showing the message on refresh
    const url = new URL(window.location.href);
    url.searchParams.delete('message');
    url.searchParams.delete('type');
    window.history.replaceState({}, document.title, url.toString());
  }
}

/**
 * Show an alert message
 * @param {string} alertId - ID of the alert element
 * @param {string} message - Message to display
 */
function showAlert(alertId, message) {
  const alertElement = document.getElementById(alertId);
  if (alertElement) {
    alertElement.innerHTML = message;
    alertElement.classList.remove('d-none');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideAlert(alertId);
    }, 5000);
  }
}

/**
 * Hide an alert message
 * @param {string} alertId - ID of the alert element
 */
function hideAlert(alertId) {
  const alertElement = document.getElementById(alertId);
  if (alertElement) {
    alertElement.classList.add('d-none');
  }
}

/**
 * Show loading spinner
 * @param {string} message - Message to show with spinner
 */
function showLoadingSpinner(message = 'Loading...') {
  // Check if spinner already exists
  let spinner = document.getElementById('loadingSpinner');
  
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'loadingSpinner';
    spinner.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50';
    spinner.style.zIndex = '9999';
    
    spinner.innerHTML = `
      <div class="bg-white p-4 rounded shadow text-center">
        <div class="spinner-border text-primary mb-2" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mb-0" id="spinnerMessage">${message}</p>
      </div>
    `;
    
    document.body.appendChild(spinner);
  } else {
    // Update message if spinner exists
    document.getElementById('spinnerMessage').textContent = message;
    spinner.classList.remove('d-none');
  }
}

/**
 * Hide loading spinner
 */
function hideLoadingSpinner() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    // Use timeout for smoother UX
    setTimeout(() => {
      spinner.remove();
    }, 300);
  }
}