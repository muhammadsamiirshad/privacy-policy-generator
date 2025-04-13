# Privacy Policy Generator

A client-side web application that helps businesses generate GDPR and CCPA-compliant privacy policies for their websites and applications.

## Features

- **User-friendly form**: Easily create custom privacy policies by answering simple questions
- **Multi-format export**: Download privacy policies in various formats (HTML, PDF, plain text)
- **Account management**: Save and manage multiple privacy policies
- **Compliance coverage**: GDPR, CCPA, and general best practices for privacy policies
- **Responsive design**: Works on all devices including desktops, tablets, and mobile phones
- **100% client-side**: No server required, all processing happens in the browser

## Installation

This is a pure HTML, CSS, and JavaScript application that runs entirely in the browser. No build process or server is required.

### Option 1: Direct Usage

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/privacy-policy-generator.git
   ```

2. Open `index.html` in your web browser.

### Option 2: Using a Local Server

For the best experience, especially when testing locally, you can use a simple HTTP server:

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open your browser and navigate to `http://localhost:5000`

## How It Works

1. Users fill out a comprehensive form with details about their website, data collection practices, and company information
2. The application processes this information and generates a customized privacy policy 
3. Users can preview, edit, and download the policy in their preferred format
4. Registered users can save policies to their account for future reference and updates

## Project Structure

```
privacy-policy-generator/
├── index.html                 # Home page
├── about.html                 # About page
├── contact.html               # Contact page
├── login.html                 # Login page
├── register.html              # Registration page
├── generate.html              # Policy generator form
├── dashboard.html             # User dashboard
├── profile.html               # User profile management
├── public/
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   ├── js/
│   │   ├── auth.js            # Authentication functions
│   │   └── script.js          # Main application logic
│   └── img/                   # Image assets
└── README.md                  # Project documentation
```

## Local Storage

This application uses the browser's local storage to:
- Store user account information
- Save generated privacy policies
- Maintain user sessions

All data is stored locally on the user's device and is not transmitted to any server.

## License

[MIT License](LICENSE)

## Credits

- Bootstrap 5 for UI components
- FontAwesome for icons
- CryptoJS for client-side encryption

## Disclaimer

While this tool aims to generate accurate and compliant privacy policies, they should be reviewed by a legal professional before implementation. The generators and templates are provided as-is without any warranty.