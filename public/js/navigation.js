/**
 * Common navigation initialization for all pages
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Navigation script loaded');
  
  // Always ensure navigation is set up, regardless of what page we're on
  initializeNavigation();
});

/**
 * Initialize navigation for any page
 */
function initializeNavigation() {
  console.log('Initializing navigation...');
  const navbarLinks = document.getElementById('navbarLinks');
  
  if (!navbarLinks) {
    console.error('Navigation container not found! (navbarLinks)');
    return;
  }
  
  // Ensure navigation is updated
  try {
    // First check if auth.js has loaded by checking if updateNavigation exists
    if (typeof updateNavigation === 'function') {
      console.log('Using auth.js updateNavigation');
      updateNavigation();
    } else {
      // Fallback to basic navigation if auth.js hasn't loaded or isn't available
      console.log('Falling back to basic navigation (auth.js not loaded)');
      setBasicNavigation(navbarLinks);
    }
    
    // Add special handling for Generate Policy links
    setupGeneratePolicyLinks();
  } catch (error) {
    console.error('Error initializing navigation:', error);
    // Ensure we at least have basic navigation if something fails
    setBasicNavigation(navbarLinks);
  }
}

/**
 * Special handling for Generate Policy links
 * This ensures users are redirected to login if they click on Generate Policy while not authenticated
 */
function setupGeneratePolicyLinks() {
  // Target all generate policy links that might be present in the navigation
  document.querySelectorAll('a[href="./generate.html"], a[href="generate.html"]').forEach(link => {
    link.addEventListener('click', function(e) {
      // Only intercept if we have the authentication check function
      if (typeof checkAuthStatus === 'function') {
        e.preventDefault();
        
        // Check if user is authenticated
        checkAuthStatus()
          .then(user => {
            if (user) {
              // User is authenticated, proceed to generate page
              window.location.href = './generate.html';
            } else {
              // User is not authenticated, redirect to login with a message
              window.location.href = './login.html?message=Please log in to generate a policy&type=info';
            }
          })
          .catch(error => {
            console.error('Authentication check error:', error);
            // On error, redirect to login
            window.location.href = './login.html?message=Please log in to continue&type=info';
          });
      }
      // If checkAuthStatus doesn't exist, the link will work normally
    });
  });
}

/**
 * Set basic navigation links as fallback if auth.js is not available
 * @param {HTMLElement} navbarLinks - The navigation container
 */
function setBasicNavigation(navbarLinks) {
  // Only set if container is empty to avoid duplicates
  if (navbarLinks.children.length === 0) {
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
    
    // After setting basic navigation, set up special handling for protected links
    setupGeneratePolicyLinks();
  }
  
  // Highlight the active page
  highlightActivePage();
}

/**
 * Highlight the active page in navigation
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
    } else {
      link.classList.remove('active');
    }
  });
}