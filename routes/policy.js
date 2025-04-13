const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const { htmlToText } = require('html-to-text');
const { db, encrypt, decrypt } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// Temporary memory storage for policy data (for non-authenticated users)
let policyData = new Map();

// Helper function to generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper function to generate policy text based on user inputs
const generatePolicyText = (data) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<h1>${data.websiteName} Privacy Policy</h1>
<p><strong>Last Updated:</strong> ${currentDate}</p>

<h2>Introduction</h2>
<p>${data.companyName} ("we", "our", or "us") operates the ${data.websiteName} website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>

<p>We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.</p>

<h2>Information Collection and Use</h2>
<p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>

<h3>Types of Data Collected</h3>
<h4>Personal Data</h4>
<p>While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:</p>
<ul>
${data.collectedData.split(',').map(item => `<li>${item.trim()}</li>`).join('\n')}
</ul>

<h4>Usage Data</h4>
<p>We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g., IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers, and other diagnostic data.</p>

${data.useCookies === 'yes' ? `
<h4>Tracking & Cookies Data</h4>
<p>We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.</p>
<p>Cookies are files with a small amount of data which may include an anonymous unique identifier. Cookies are sent to your browser from a website and stored on your device.</p>
<p>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</p>
<p>Examples of Cookies we use:</p>
<ul>
  <li><strong>Session Cookies:</strong> We use Session Cookies to operate our Service.</li>
  <li><strong>Preference Cookies:</strong> We use Preference Cookies to remember your preferences and various settings.</li>
  <li><strong>Security Cookies:</strong> We use Security Cookies for security purposes.</li>
</ul>
` : ''}

<h2>Use of Data</h2>
<p>${data.companyName} uses the collected data for various purposes:</p>
<ul>
  <li>To provide and maintain our Service</li>
  <li>To notify you about changes to our Service</li>
  <li>To allow you to participate in interactive features of our Service when you choose to do so</p>
  <li>To provide customer support</li>
  <li>To gather analysis or valuable information so that we can improve our Service</li>
  <li>To monitor the usage of our Service</li>
  <li>To detect, prevent and address technical issues</li>
</ul>

<h2>Data Storage</h2>
<p>${data.dataStorage}</p>

<h2>Data Retention</h2>
<p>${data.dataRetention}</p>

${data.thirdPartyServices ? `
<h2>Third-Party Services</h2>
<p>We may employ third party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.</p>
<p>These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>
<p>The third-party services we use include:</p>
<ul>
${data.thirdPartyServices.split(',').map(item => `<li>${item.trim()}</li>`).join('\n')}
</ul>
` : ''}

<h2>Security of Data</h2>
<p>The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>

${data.gdprCompliant === 'yes' ? `
<h2>Your Data Protection Rights Under GDPR</h2>
<p>If you are a resident of the European Union (EU) and European Economic Area (EEA), you have certain data protection rights. ${data.companyName} aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.</p>
<p>If you wish to be informed what Personal Data we hold about you and if you want it to be removed from our systems, please contact us.</p>
<p>In certain circumstances, you have the following data protection rights:</p>
<ul>
  <li>The right to access, update or to delete the information we have on you.</li>
  <li>The right of rectification - You have the right to have your information rectified if that information is inaccurate or incomplete.</li>
  <li>The right to object - You have the right to object to our processing of your Personal Data.</li>
  <li>The right of restriction - You have the right to request that we restrict the processing of your personal information.</li>
  <li>The right to data portability - You have the right to be provided with a copy of the information we have on you in a structured, machine-readable and commonly used format.</li>
  <li>The right to withdraw consent - You also have the right to withdraw your consent at any time where ${data.companyName} relied on your consent to process your personal information.</li>
</ul>
<p>Please note that we may ask you to verify your identity before responding to such requests.</p>
` : ''}

${data.ccpaCompliant === 'yes' ? `
<h2>Your Data Protection Rights Under CCPA (California Consumer Privacy Act)</h2>
<p>If you are a California resident, you have the right to:</p>
<ul>
  <li>Request that a business that collects a consumer's personal data disclose the categories and specific pieces of personal data that a business has collected about consumers.</li>
  <li>Request that a business delete any personal data about the consumer that a business has collected.</li>
  <li>Request that a business that sells a consumer's personal data, not sell the consumer's personal data.</li>
</ul>
<p>If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.</p>
` : ''}

<h2>Changes to This Privacy Policy</h2>
<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
<p>We will let you know via email and/or a prominent notice on our Service, prior to the change becoming effective and update the "effective date" at the top of this Privacy Policy.</p>
<p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

<h2>Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us:</p>
<ul>
  <li>By email: ${data.contactEmail}</li>
  ${data.contactPhone ? `<li>By phone: ${data.contactPhone}</li>` : ''}
  ${data.contactAddress ? `<li>By mail: ${data.contactAddress}</li>` : ''}
</ul>
  `;
};

// API endpoint to generate a privacy policy
router.post('/generate', [
  check('websiteName').notEmpty().withMessage('Website name is required'),
  check('companyName').notEmpty().withMessage('Company name is required'),
  check('collectedData').notEmpty().withMessage('Collected data is required'),
  check('dataStorage').notEmpty().withMessage('Data storage information is required'),
  check('dataRetention').notEmpty().withMessage('Data retention information is required'),
  check('contactEmail').isEmail().withMessage('Valid contact email is required'),
  check('useCookies').isIn(['yes', 'no']).withMessage('Must specify whether cookies are used'),
  check('gdprCompliant').isIn(['yes', 'no']).withMessage('Must specify whether policy is GDPR compliant'),
], (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Generate policy text
    const policyText = generatePolicyText(req.body);
    
    // Create policy ID
    const policyId = generateId();
    
    // If user is authenticated, save to database
    if (req.session && req.session.userId) {
      // Encrypt ALL sensitive policy data
      const encryptedPolicyText = encrypt(policyText);
      const encryptedWebsiteName = encrypt(req.body.websiteName);
      const encryptedCompanyName = encrypt(req.body.companyName);
      const encryptedData = encrypt(JSON.stringify(req.body)); // Encrypt all form data
      
      db.run(
        'INSERT INTO policies (user_id, policy_id, website_name, company_name, policy_text, encrypted_policy_text, encrypted_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [req.session.userId, policyId, req.body.websiteName, req.body.companyName, policyText, encryptedPolicyText, encryptedData],
        function(err) {
          if (err) {
            console.error('Error saving policy to database:', err);
            // Continue with memory storage as fallback
          }
        }
      );
    }
    
    // Store policy in memory (for both authenticated and non-authenticated users)
    policyData.set(policyId, {
      policyText,
      userData: req.body,
      created: new Date()
    });
    
    // Auto-cleanup old policies after 24 hours (for memory storage only)
    setTimeout(() => {
      if (policyData.has(policyId)) {
        policyData.delete(policyId);
      }
    }, 86400000); // 24 hours in milliseconds
    
    // Return policy ID and text
    res.json({ 
      success: true, 
      policyId, 
      policyText,
      isSaved: !!(req.session && req.session.userId)
    });
  } catch (error) {
    console.error('Error generating policy:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate privacy policy' 
    });
  }
});

// API endpoint to save a generated policy to authenticated user's account
router.post('/save/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  
  if (!policyData.has(id)) {
    return res.status(404).json({
      success: false,
      message: 'Privacy policy not found'
    });
  }
  
  const { policyText, userData } = policyData.get(id);
  
  // Check if policy already exists for this user
  db.get('SELECT id FROM policies WHERE policy_id = ? AND user_id = ?', 
    [id, req.session.userId], 
    (err, policy) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (policy) {
        return res.status(200).json({ 
          success: true, 
          message: 'Policy already saved to your account',
          policyId: id
        });
      }

      db.run(
        'INSERT INTO policies (user_id, policy_id, website_name, company_name, policy_text, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [req.session.userId, id, userData.websiteName, userData.companyName, policyText],
        function(err) {
          if (err) {
            console.error('Error saving policy:', err);
            return res.status(500).json({ success: false, message: 'Failed to save policy' });
          }
          
          res.json({ 
            success: true, 
            message: 'Policy saved to your account',
            policyId: id
          });
        }
      );
    });
});

// API endpoint to get a generated policy by ID
router.get('/policy/:id', (req, res) => {
  const { id } = req.params;
  
  // Try to get from database first if user is authenticated
  if (req.session && req.session.userId) {
    db.get('SELECT * FROM policies WHERE policy_id = ?', [id], (err, policy) => {
      if (err) {
        console.error('Database error:', err);
      }
      
      if (policy) {
        return res.json({
          success: true,
          policy: {
            policyText: policy.policy_text,
            userData: {
              websiteName: policy.website_name,
              companyName: policy.company_name
            },
            created: policy.created_at
          }
        });
      }
      
      // Fall back to memory if not found in database
      if (!policyData.has(id)) {
        return res.status(404).json({
          success: false,
          message: 'Privacy policy not found'
        });
      }
      
      res.json({
        success: true,
        policy: policyData.get(id)
      });
    });
  } else {
    // For non-authenticated users, use memory storage
    if (!policyData.has(id)) {
      return res.status(404).json({
        success: false,
        message: 'Privacy policy not found'
      });
    }
    
    res.json({
      success: true,
      policy: policyData.get(id)
    });
  }
});

// API endpoint to download policy as text file
router.get('/download/:id/text', (req, res) => {
  const { id } = req.params;
  
  // Try to get from database first if user is authenticated
  if (req.session && req.session.userId) {
    db.get('SELECT * FROM policies WHERE policy_id = ?', [id], (err, policy) => {
      if (err) {
        console.error('Database error:', err);
      }
      
      if (policy) {
        const plainText = htmlToText(policy.policy_text, {
          wordwrap: 80,
          selectors: [
            { selector: 'h1', options: { uppercase: true } },
            { selector: 'h2', options: { uppercase: true } },
            { selector: 'a', options: { ignoreHref: true } }
          ]
        });
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${policy.website_name.replace(/\s+/g, '-')}-Privacy-Policy.txt"`);
        return res.send(plainText);
      }
      
      // Fall back to memory if not found in database
      if (!policyData.has(id)) {
        return res.status(404).json({
          success: false,
          message: 'Privacy policy not found'
        });
      }
      
      const { policyText, userData } = policyData.get(id);
      const plainText = htmlToText(policyText, {
        wordwrap: 80,
        selectors: [
          { selector: 'h1', options: { uppercase: true } },
          { selector: 'h2', options: { uppercase: true } },
          { selector: 'a', options: { ignoreHref: true } }
        ]
      });
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${userData.websiteName.replace(/\s+/g, '-')}-Privacy-Policy.txt"`);
      res.send(plainText);
    });
  } else {
    // For non-authenticated users, use memory storage
    if (!policyData.has(id)) {
      return res.status(404).json({
        success: false,
        message: 'Privacy policy not found'
      });
    }
    
    const { policyText, userData } = policyData.get(id);
    const plainText = htmlToText(policyText, {
      wordwrap: 80,
      selectors: [
        { selector: 'h1', options: { uppercase: true } },
        { selector: 'h2', options: { uppercase: true } },
        { selector: 'a', options: { ignoreHref: true } }
      ]
    });
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${userData.websiteName.replace(/\s+/g, '-')}-Privacy-Policy.txt"`);
    res.send(plainText);
  }
});

// API endpoint to download policy as PDF
router.get('/download/:id/pdf', (req, res) => {
  const { id } = req.params;
  
  // Function to generate the PDF
  function generatePDF(policyText, userData) {
    // Create a PDF document with better styling
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `${userData.websiteName} Privacy Policy`,
        Author: userData.companyName,
        Subject: 'Privacy Policy Document',
        Keywords: 'privacy, policy, GDPR, data protection',
        Creator: 'Privacy Policy Generator',
        Producer: 'Privacy Policy Generator'
      }
    });
    
    const filename = `${userData.websiteName.replace(/\s+/g, '-')}-Privacy-Policy.pdf`;
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add a header with logo/branding
    doc.fontSize(10).text('Generated with Privacy Policy Generator', { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(new Date().toLocaleDateString(), { align: 'right' });
    doc.moveDown(2);
    
    // Add the title
    doc.fontSize(24)
       .fillColor('#336699')
       .text(`${userData.websiteName} Privacy Policy`, { align: 'center' });
    doc.moveDown();
    
    // Convert HTML to a structured format for the PDF
    const htmlContent = policyText;
    
    // Function to extract and format HTML content
    function processHTML(html) {
      // Extract sections
      const sections = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>[\s\S]*?(?=<h[1-6]|$)/g) || [];
      
      for (let section of sections) {
        // Extract heading
        const headingMatch = section.match(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/);
        if (headingMatch) {
          const level = parseInt(headingMatch[1]);
          const headingText = headingMatch[2].replace(/<[^>]*>/g, '').trim();
          
          // Style based on heading level
          if (level === 1) {
            doc.moveDown(0.5);
            doc.fontSize(20).fillColor('#336699').text(headingText, { align: 'center' });
            doc.moveDown();
          } else if (level === 2) {
            doc.moveDown();
            doc.fontSize(16).fillColor('#336699').text(headingText);
            doc.moveDown(0.5);
          } else if (level <= 4) {
            doc.moveDown();
            doc.fontSize(14).fillColor('#336699').text(headingText);
            doc.moveDown(0.5);
          } else {
            doc.moveDown();
            doc.fontSize(12).fillColor('#336699').text(headingText);
            doc.moveDown(0.5);
          }
        }
        
        // Extract content after heading but before next heading
        const contentMatch = section.replace(/<h[1-6][^>]*>.*?<\/h[1-6]>/s, '');
        
        // Process paragraphs
        const paragraphs = contentMatch.match(/<p>(.*?)<\/p>/g) || [];
        for (let paragraph of paragraphs) {
          const text = paragraph.replace(/<p>(.*?)<\/p>/s, '$1')
                                .replace(/<[^>]*>/g, '')
                                .trim();
          doc.fontSize(11).fillColor('black').text(text, { align: 'left' });
          doc.moveDown(0.5);
        }
        
        // Process lists
        const lists = contentMatch.match(/<ul>(.*?)<\/ul>/gs) || [];
        for (let list of lists) {
          const items = list.match(/<li>(.*?)<\/li>/g) || [];
          for (let item of items) {
            const text = item.replace(/<li>(.*?)<\/li>/, '$1')
                            .replace(/<[^>]*>/g, '')
                            .trim();
            doc.fontSize(11).fillColor('black').text(`• ${text}`, { indent: 20, align: 'left' });
            doc.moveDown(0.25);
          }
          doc.moveDown(0.5);
        }
      }
    }
    
    // Process HTML content for the PDF
    processHTML(htmlContent);
    
    // Add footer with page numbers
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(10).fillColor('#666666').text(
        `Page ${i + 1} of ${totalPages}`, 
        { align: 'center' }
      );
    }
    
    // Add company information at the end
    doc.addPage();
    doc.fontSize(14).fillColor('#336699').text('Contact Information', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).fillColor('black').text(`Company: ${userData.companyName}`);
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Email: ${userData.contactEmail}`);
    
    if (userData.contactPhone) {
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Phone: ${userData.contactPhone}`);
    }
    
    if (userData.contactAddress) {
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Address: ${userData.contactAddress}`);
    }
    
    // Finalize the PDF and end the response
    doc.end();
  }
  
  // Try to get from database first if user is authenticated
  if (req.session && req.session.userId) {
    db.get('SELECT * FROM policies WHERE policy_id = ?', [id], (err, policy) => {
      if (err) {
        console.error('Database error:', err);
      }
      
      if (policy) {
        return generatePDF(policy.policy_text, {
          websiteName: policy.website_name,
          companyName: policy.company_name,
          contactEmail: req.session.email || "contact@example.com",  // Fallback
          contactPhone: "",  // We don't store these details in DB currently
          contactAddress: ""
        });
      }
      
      // Fall back to memory if not found in database
      if (!policyData.has(id)) {
        return res.status(404).json({
          success: false,
          message: 'Privacy policy not found'
        });
      }
      
      const { policyText, userData } = policyData.get(id);
      generatePDF(policyText, userData);
    });
  } else {
    // For non-authenticated users, use memory storage
    if (!policyData.has(id)) {
      return res.status(404).json({
        success: false,
        message: 'Privacy policy not found'
      });
    }
    
    const { policyText, userData } = policyData.get(id);
    generatePDF(policyText, userData);
  }
});

// API endpoint to delete a policy (authenticated users only)
router.delete('/delete/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM policies WHERE policy_id = ? AND user_id = ?', 
    [id, req.session.userId], 
    function(err) {
      if (err) {
        console.error('Error deleting policy:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete policy' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Policy not found or you do not have permission to delete it'
        });
      }
      
      // Also remove from memory cache if present
      if (policyData.has(id)) {
        policyData.delete(id);
      }
      
      res.json({
        success: true,
        message: 'Policy deleted successfully'
      });
    });
});

module.exports = router;