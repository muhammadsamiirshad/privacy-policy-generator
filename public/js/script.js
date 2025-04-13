/**
 * Privacy Policy Generator - Main script
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(function(tooltipTriggerEl) {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Initialize Bootstrap popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.forEach(function(popoverTriggerEl) {
    new bootstrap.Popover(popoverTriggerEl);
  });

  // Handle flash messages auto-close after 5 seconds
  setTimeout(function() {
    const alerts = document.querySelectorAll('.alert:not(.d-none)');
    alerts.forEach(function(alert) {
      if (bootstrap.Alert && !alert.classList.contains('d-none')) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    });
  }, 5000);

  // Handle form validation
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(function(form) {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });

  // Logout Button Handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(event) {
      event.preventDefault();
      const confirmLogout = confirm('Are you sure you want to log out?');
      if (confirmLogout) {
        logout(); // Function from auth.js
      }
    });
  }

  // Policy Form Handler (on generate.html page)
  const policyForm = document.getElementById('policyForm');
  if (policyForm) {
    policyForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      if (!policyForm.checkValidity()) {
        event.stopPropagation();
        policyForm.classList.add('was-validated');
        return;
      }
      
      // Get form data
      const formData = new FormData(policyForm);
      const formDataObj = Object.fromEntries(formData.entries());
      
      // Handle multiple select values
      if (formDataObj.cookiesPurpose) {
        const cookiesSelect = document.getElementById('cookiesPurpose');
        const selectedOptions = Array.from(cookiesSelect.selectedOptions).map(option => option.value);
        formDataObj.cookiesPurpose = selectedOptions;
      }
      
      // Handle checkboxes for data regions
      formDataObj.dataRegions = [];
      document.querySelectorAll('input[name="dataRegions"]:checked').forEach(checkbox => {
        formDataObj.dataRegions.push(checkbox.value);
      });
      
      // Show loading spinner
      showLoadingSpinner();
      
      try {
        // Generate policy HTML
        const policyHtml = generatePrivacyPolicy(formDataObj);
        
        // Hide spinner
        hideLoadingSpinner();
        
        // Display in modal
        document.getElementById('policyContent').innerHTML = policyHtml;
        const policyModal = new bootstrap.Modal(document.getElementById('policyModal'));
        policyModal.show();
        
        // Store policy in localStorage for later access
        const policyData = {
          id: generatePolicyId(),
          title: `Privacy Policy for ${formDataObj.companyName}`,
          content: policyHtml,
          formData: formDataObj,
          created_at: new Date().toISOString()
        };
        
        sessionStorage.setItem('currentPolicy', JSON.stringify(policyData));
        
        // Set up download handlers
        setupDownloadHandlers(policyData);
        
      } catch (error) {
        hideLoadingSpinner();
        showErrorAlert('An error occurred while generating the policy.');
        console.error('Error:', error);
      }
    });
  }
  
  // Setup handlers for dashboard.html
  if (window.location.pathname.includes('dashboard.html')) {
    loadUserPolicies();
  }
  
  // Password toggle visibility for login/register forms
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  togglePasswordBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const passwordInput = this.closest('.input-group').querySelector('input');
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.querySelector('i').classList.toggle('fa-eye');
      this.querySelector('i').classList.toggle('fa-eye-slash');
    });
  });
  
  // Third party services toggle
  const useThirdParty = document.getElementById('useThirdParty');
  if (useThirdParty) {
    useThirdParty.addEventListener('change', function() {
      const thirdPartyContainer = document.getElementById('thirdPartyContainer');
      thirdPartyContainer.style.display = this.checked ? 'block' : 'none';
    });
  }
  
  // Cookie details toggle
  const cookiesRadios = document.querySelectorAll('input[name="useCookies"]');
  if (cookiesRadios.length > 0) {
    cookiesRadios.forEach(function(radio) {
      radio.addEventListener('change', function() {
        const cookiesDetailsDiv = document.getElementById('cookiesDetailsDiv');
        if (cookiesDetailsDiv) {
          cookiesDetailsDiv.style.display = this.value === 'yes' ? 'block' : 'none';
        }
      });
    });
  }
  
  // Handle URL parameters for messages
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('message')) {
    const message = urlParams.get('message');
    const type = urlParams.get('type') || 'info';
    
    if (type === 'success') {
      showSuccessAlert(message);
    } else if (type === 'error') {
      showErrorAlert(message);
    } else {
      showInfoAlert(message);
    }
  }

  // Apply current year to footer
  document.querySelectorAll('#currentYear').forEach(element => {
    element.textContent = new Date().getFullYear();
  });
});

/**
 * Set up download handlers for policy modal buttons
 * @param {Object} policyData - The generated policy data
 */
function setupDownloadHandlers(policyData) {
  // Copy to clipboard button
  const copyBtn = document.getElementById('copyText');
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      const policyText = document.getElementById('policyContent').innerText;
      
      navigator.clipboard.writeText(policyText).then(function() {
        showSuccessAlert('Policy copied to clipboard!');
      }).catch(function(err) {
        console.error('Could not copy text: ', err);
        showErrorAlert('Failed to copy to clipboard.');
      });
    });
  }
  
  // Download as text
  const downloadTxtBtn = document.getElementById('downloadTxt');
  if (downloadTxtBtn) {
    downloadTxtBtn.addEventListener('click', function() {
      const policyText = document.getElementById('policyContent').innerText;
      const blob = new Blob([policyText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Privacy_Policy_${policyData.formData.companyName.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    });
  }
  
  // Download as PDF (requires html2pdf library)
  const downloadPdfBtn = document.getElementById('downloadPdf');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', function() {
      // If html2pdf isn't loaded, dynamically load it
      if (typeof html2pdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = generatePdf;
        document.head.appendChild(script);
      } else {
        generatePdf();
      }

      function generatePdf() {
        const element = document.getElementById('policyContent');
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `Privacy_Policy_${policyData.formData.companyName.replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        showLoadingSpinner('Generating PDF...');
        
        // Generate PDF
        html2pdf().set(opt).from(element).save().then(function() {
          hideLoadingSpinner();
          showSuccessAlert('PDF downloaded successfully!');
        }).catch(function(error) {
          hideLoadingSpinner();
          showErrorAlert('Error generating PDF.');
          console.error('PDF generation error:', error);
        });
      }
    });
  }
  
  // Save policy to account button
  const saveToAccountBtn = document.getElementById('saveToAccount');
  if (saveToAccountBtn) {
    saveToAccountBtn.addEventListener('click', async function() {
      try {
        // Show loading spinner
        showLoadingSpinner('Saving policy to your account...');
        
        // Save policy using the function from auth.js
        const result = await savePolicy(policyData);
        
        hideLoadingSpinner();
        
        if (result) {
          showSuccessAlert('Policy saved to your account successfully!');
          
          // Update button state
          saveToAccountBtn.disabled = true;
          saveToAccountBtn.innerHTML = '<i class="fas fa-check me-2"></i>Saved to Account';
          saveToAccountBtn.classList.remove('btn-primary');
          saveToAccountBtn.classList.add('btn-success');
        } else {
          showErrorAlert('Failed to save the policy to your account.');
        }
      } catch (error) {
        hideLoadingSpinner();
        if (error.message === 'User not authenticated') {
          window.location.href = './login.html?message=Please log in to save policies&type=info';
        } else {
          showErrorAlert('Error saving policy: ' + error.message);
          console.error('Save policy error:', error);
        }
      }
    });
  }
}

/**
 * Load user's saved policies on the dashboard
 */
function loadUserPolicies() {
  const policiesContainer = document.getElementById('policiesContainer');
  
  if (!policiesContainer) {
    return;
  }
  
  showLoadingSpinner('Loading your policies...');
  
  try {
    checkAuthStatus()
      .then(user => {
        if (!user) {
          hideLoadingSpinner();
          window.location.href = 'login.html?message=Please log in to view your policies&type=info';
          return Promise.reject(new Error('User not authenticated'));
        }
        return getUserPolicies();
      })
      .then(policies => {
        hideLoadingSpinner();
        
        if (policies.length === 0) {
          policiesContainer.innerHTML = `
            <div class="text-center py-5">
              <i class="fas fa-file-alt fa-4x text-muted mb-3"></i>
              <h3>No Policies Found</h3>
              <p class="text-muted">You haven't created any privacy policies yet.</p>
              <a href="./generate.html" class="btn btn-primary mt-2">
                <i class="fas fa-plus me-2"></i>Create Your First Policy
              </a>
            </div>
          `;
          return;
        }
        
        // Sort policies by date (newest first)
        policies.sort((a, b) => new Date(b.created_at || b.created) - new Date(a.created_at || a.created));
        
        // Create policy cards
        const policyCardsHtml = policies.map((policy, index) => {
          const date = new Date(policy.created_at || policy.created);
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
          });
          
          // Get policy title or create a default one
          const policyTitle = policy.title || `Privacy Policy for ${policy.formData?.websiteName || 'Unnamed Website'}`;
          const companyName = policy.formData?.companyName || 'Unnamed Company';
          
          return `
            <div class="col-md-6 col-lg-4 mb-4">
              <div class="card h-100 shadow-sm">
                <div class="card-header bg-primary text-white">
                  <h5 class="card-title mb-0 text-truncate">${policyTitle}</h5>
                </div>
                <div class="card-body">
                  <p class="card-text">
                    <i class="fas fa-calendar-alt me-2"></i> Created: ${formattedDate}<br>
                    <i class="fas fa-building me-2"></i> Company: ${companyName}
                  </p>
                  <div class="d-grid gap-2 mt-3">
                    <button class="btn btn-sm btn-outline-primary view-policy-btn" data-policy-index="${index}">
                      <i class="fas fa-eye me-1"></i> View Policy
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-policy-btn" 
                            data-policy-id="${policy.id}"
                            data-policy-name="${policyTitle}">
                      <i class="fas fa-trash-alt me-1"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');
        
        policiesContainer.innerHTML = `
          <div class="row mb-4">
            <div class="col-12">
              <h2>Your Saved Policies</h2>
              <p class="text-muted">You have ${policies.length} saved privacy ${policies.length === 1 ? 'policy' : 'policies'}</p>
            </div>
          </div>
          <div class="row" id="policyCards">
            ${policyCardsHtml}
          </div>
        `;
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-policy-btn').forEach(button => {
          button.addEventListener('click', function() {
            const policyIndex = this.getAttribute('data-policy-index');
            const policy = policies[policyIndex];
            
            // Store in session storage for viewing
            sessionStorage.setItem('currentPolicy', JSON.stringify(policy));
            
            // Redirect to view page
            window.location.href = './policy-view.html?id=' + policy.id;
          });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-policy-btn').forEach(button => {
          button.addEventListener('click', function() {
            const policyId = this.getAttribute('data-policy-id');
            const policyName = this.getAttribute('data-policy-name');
            
            // Use the modal confirmation instead of confirm()
            if (typeof window.showDeleteConfirmation === 'function') {
              window.showDeleteConfirmation(policyId, policyName);
            } else {
              // Fallback to old confirmation if modal function isn't available
              const confirmDelete = confirm('Are you sure you want to delete this policy? This action cannot be undone.');
              
              if (confirmDelete) {
                handlePolicyDeletion(policyId);
              }
            }
          });
        });
      })
      .catch(error => {
        hideLoadingSpinner();
        if (error.message !== 'User not authenticated') { // We already handle this case above
          showErrorAlert('Error loading policies: ' + error.message);
          console.error('Load policies error:', error);
        }
      });
  } catch (error) {
    hideLoadingSpinner();
    showErrorAlert('Error loading policies: ' + error.message);
    console.error('Load policies error:', error);
  }
}

/**
 * Handle policy deletion process
 * @param {string} policyId - ID of the policy to delete
 */
function handlePolicyDeletion(policyId) {
  showLoadingSpinner('Deleting policy...');
  
  deletePolicy(policyId)
    .then(() => {
      hideLoadingSpinner();
      showSuccessAlert('Policy deleted successfully!');
      
      // Refresh the policies list
      setTimeout(() => {
        loadUserPolicies();
      }, 1000);
    })
    .catch(error => {
      hideLoadingSpinner();
      showErrorAlert('Error deleting policy: ' + error.message);
      console.error('Delete policy error:', error);
    });
}

/**
 * Generate a unique ID for a policy
 * @returns {string} A unique ID
 */
function generatePolicyId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

/**
 * Generate the privacy policy HTML based on form data
 * @param {Object} formData - The form data
 * @returns {string} The generated privacy policy HTML
 */
function generatePrivacyPolicy(formData) {
  // Format the current date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Start generating the policy content
  let policyHtml = `
    <div class="policy-document">
      <div class="policy-header">
        <h1>Privacy Policy</h1>
        <p>Last Updated: ${formattedDate}</p>
      </div>
      
      <div class="policy-section">
        <h2>Introduction</h2>
        <p>This Privacy Policy explains how ${formData.companyName} ("we", "us", or "our") collects, uses, discloses, and safeguards your information when you use our website${formData.websiteUrl ? ' <a href="' + formData.websiteUrl + '">' + formData.websiteUrl + '</a>' : ''} and our services.</p>
        <p>We are committed to protecting your personal information and your right to privacy. Please read this privacy policy carefully.</p>
      </div>
      
      <div class="policy-section">
        <h2>Information We Collect</h2>
        <p>We may collect the following types of information:</p>
  `;
  
  // Add data collection details
  const collectedDataArray = formData.collectedData.split(',').map(item => item.trim());
  if (collectedDataArray.length > 0) {
    policyHtml += '<ul>';
    collectedDataArray.forEach(data => {
      policyHtml += `<li><strong>${data}</strong></li>`;
    });
    policyHtml += '</ul>';
  }
  
  // Add cookies information
  policyHtml += `
      </div>
      
      <div class="policy-section">
        <h2>Cookies and Tracking Technologies</h2>
  `;
  
  if (formData.useCookies === 'yes') {
    policyHtml += `<p>We use cookies and similar tracking technologies to collect and track information about you. Cookies are small files that a site or its service provider places on your device to identify your browser.</p>`;
    
    if (formData.cookiesPurpose && formData.cookiesPurpose.length > 0) {
      policyHtml += `<p>We use cookies for the following purposes:</p><ul>`;
      
      if (formData.cookiesPurpose.includes('essential')) {
        policyHtml += `<li><strong>Essential cookies:</strong> These cookies are necessary for our website to function properly and cannot be switched off. They are usually set in response to actions made by you such as setting your privacy preferences, logging in, or filling in forms.</li>`;
      }
      
      if (formData.cookiesPurpose.includes('analytics')) {
        policyHtml += `<li><strong>Analytics cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.</li>`;
      }
      
      if (formData.cookiesPurpose.includes('advertising')) {
        policyHtml += `<li><strong>Advertising cookies:</strong> These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other sites.</li>`;
      }
      
      if (formData.cookiesPurpose.includes('preferences')) {
        policyHtml += `<li><strong>Preference cookies:</strong> These cookies enable our website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.</li>`;
      }
      
      if (formData.cookiesPurpose.includes('social')) {
        policyHtml += `<li><strong>Social media cookies:</strong> These cookies are set by social media services that we have added to the site to enable you to share our content with your friends and networks.</li>`;
      }
      
      policyHtml += `</ul>`;
    }
    
    policyHtml += `<p>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</p>`;
  } else {
    policyHtml += `<p>We do not use cookies or tracking technologies to collect information about you.</p>`;
  }
  
  // Add data storage and retention section
  policyHtml += `
      </div>
      
      <div class="policy-section">
        <h2>Data Storage and Retention</h2>
        <p>${formData.dataStorage}</p>
        <p>We will retain your personal data for: ${formData.dataRetention}</p>
  `;
  
  // Add data regions information
  if (formData.dataRegions && formData.dataRegions.length > 0) {
    policyHtml += `<p>Your information may be stored and processed in the following regions:</p><ul>`;
    
    if (formData.dataRegions.includes('usa')) {
      policyHtml += `<li>United States of America</li>`;
    }
    
    if (formData.dataRegions.includes('eu')) {
      policyHtml += `<li>European Union</li>`;
    }
    
    if (formData.dataRegions.includes('other')) {
      policyHtml += `<li>Other regions globally</li>`;
    }
    
    policyHtml += `</ul>`;
  }
  
  // Add third-party services section
  policyHtml += `
      </div>
      
      <div class="policy-section">
        <h2>Third-Party Services</h2>
  `;
  
  if (formData.useThirdParty) {
    policyHtml += `<p>We may use third-party service providers to help us operate our business, provide services, or administer activities on our behalf.</p>`;
    
    if (formData.thirdPartyServices) {
      const thirdPartyServicesArray = formData.thirdPartyServices.split(',').map(service => service.trim());
      
      if (thirdPartyServicesArray.length > 0) {
        policyHtml += `<p>These third-party services include:</p><ul>`;
        thirdPartyServicesArray.forEach(service => {
          policyHtml += `<li>${service}</li>`;
        });
        policyHtml += `</ul>`;
      }
    }
    
    policyHtml += `<p>Please note that these third parties may have their own privacy policies governing how they use and disclose personal information. We encourage you to review the privacy policies of these third parties.</p>`;
  } else {
    policyHtml += `<p>We do not share your data with third parties except as necessary to fulfill our services or as required by law.</p>`;
  }
  
  // Add compliance information
  policyHtml += `
      </div>
      
      <div class="policy-section">
        <h2>Legal Compliance</h2>
  `;
  
  if (formData.gdprCompliant === 'yes') {
    policyHtml += `
        <h3>GDPR Compliance</h3>
        <p>For users in the European Economic Area (EEA), we comply with the General Data Protection Regulation (GDPR). Under GDPR, you have the following rights:</p>
        <ul>
          <li>The right to access – You have the right to request copies of your personal data.</li>
          <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
          <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
          <li>The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
          <li>The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.</li>
          <li>The right to data portability – You have the right to request that we transfer the data we have collected to another organization, or directly to you, under certain conditions.</li>
        </ul>
        <p>To exercise any of these rights, please contact us using the information provided below.</p>
    `;
  }
  
  if (formData.ccpaCompliant === 'yes') {
    policyHtml += `
        <h3>CCPA Compliance</h3>
        <p>If you are a resident of California, you have the following rights under the California Consumer Privacy Act (CCPA):</p>
        <ul>
          <li>The right to know about the personal information we collect about you and how it is used and shared.</li>
          <li>The right to delete personal information collected from you (with some exceptions).</li>
          <li>The right to opt-out of the sale of your personal information.</li>
          <li>The right to non-discrimination for exercising your CCPA rights.</li>
        </ul>
        <p>To exercise your rights under CCPA, please contact us using the information provided below.</p>
    `;
  }
  
  // Add contact information
  policyHtml += `
      </div>
      
      <div class="policy-section">
        <h2>Contact Information</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p><strong>Email:</strong> ${formData.contactEmail}</p>
  `;
  
  if (formData.contactPhone) {
    policyHtml += `<p><strong>Phone:</strong> ${formData.contactPhone}</p>`;
  }
  
  if (formData.contactAddress) {
    policyHtml += `<p><strong>Address:</strong> ${formData.contactAddress}</p>`;
  }
  
  // Closing section
  policyHtml += `
      </div>
      
      <div class="policy-section">
        <h2>Changes to This Privacy Policy</h2>
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
        <p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
      </div>
    </div>
  `;
  
  return policyHtml;
}

// Helper functions

/**
 * Show a loading spinner
 * @param {string} message - The message to show with the spinner
 */
function showLoadingSpinner(message = 'Loading...') {
  // Create spinner overlay if it doesn't exist
  if (!document.getElementById('spinnerOverlay')) {
    const spinnerOverlay = document.createElement('div');
    spinnerOverlay.id = 'spinnerOverlay';
    spinnerOverlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-25';
    spinnerOverlay.style.zIndex = '9999';
    
    spinnerOverlay.innerHTML = `
      <div class="bg-white p-4 rounded shadow-lg text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 mb-0" id="spinnerMessage">${message}</p>
      </div>
    `;
    
    document.body.appendChild(spinnerOverlay);
  } else {
    // Update existing spinner message
    document.getElementById('spinnerMessage').textContent = message;
    document.getElementById('spinnerOverlay').classList.remove('d-none');
  }
}

/**
 * Hide the loading spinner
 */
function hideLoadingSpinner() {
  // Remove spinner overlay if it exists
  const spinnerOverlay = document.getElementById('spinnerOverlay');
  if (spinnerOverlay) {
    spinnerOverlay.remove(); // Remove completely instead of just hiding
  }
  
  // Clean up any modal backdrops that might have been left behind
  const modalBackdrops = document.querySelectorAll('.modal-backdrop');
  modalBackdrops.forEach(backdrop => backdrop.remove());
  
  // Ensure body classes are reset
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

/**
 * Show a success alert
 * @param {string} message - The success message
 */
function showSuccessAlert(message) {
  showAlert(message, 'success');
}

/**
 * Show an error alert
 * @param {string} message - The error message
 */
function showErrorAlert(message) {
  showAlert(message, 'danger');
}

/**
 * Show an info alert
 * @param {string} message - The info message
 */
function showInfoAlert(message) {
  showAlert(message, 'info');
}

/**
 * Show an alert
 * @param {string} message - The alert message
 * @param {string} type - The alert type (success, danger, info, warning)
 */
function showAlert(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast align-items-center border-0 bg-${type} text-white`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  // Create toast content
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Initialize and show toast
  const bsToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: 5000
  });
  bsToast.show();
  
  // Remove toast from DOM after it's hidden
  toast.addEventListener('hidden.bs.toast', function() {
    toast.remove();
  });
}