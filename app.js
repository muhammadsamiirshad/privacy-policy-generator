const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import routes
const policyRoutes = require('./routes/policy');
const userRoutes = require('./routes/user');

// Database configuration
const { db } = require('./config/database');
const SQLiteStore = require('connect-sqlite3')(session);

// Create sessions directory if it doesn't exist
const sessionsDir = path.join(__dirname, 'db');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir);
}

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Session configuration
app.use(session({
  store: new SQLiteStore({ 
    db: 'sessions.sqlite', 
    dir: path.resolve(__dirname, 'db'),
    mode: 0o666,
    concurrentDB: true
  }),
  secret: process.env.SESSION_SECRET || 'your_session_secret_key_change_this',
  resave: true,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Set to false for development, true only in production with HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  rolling: true
}));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api', policyRoutes);
app.use('/api', userRoutes);

// HTML routes - serve static HTML files directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/generate', (req, res) => {
  res.sendFile(path.join(__dirname, 'generate.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/my-policies', (req, res) => {
  res.sendFile(path.join(__dirname, 'my-policies.html'));
});

app.get('/policy-view', (req, res) => {
  res.sendFile(path.join(__dirname, 'policy-view.html'));
});

// 404 page for any unmatched routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Error handling middleware - JSON responses instead of rendering views
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  // Return JSON error for API routes
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ 
      error: 'Server error', 
      message: 'Something went wrong!' 
    });
  }
  
  // For HTML routes, redirect to the 404 page
  res.status(500).sendFile(path.join(__dirname, '404.html'));
});

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  console.log('Node process will continue running despite uncaught exception');
});

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
  console.log('Node process will continue running despite unhandled rejection');
});

// Create HTTP server instance with more control
const http = require('http');
const server = http.createServer(app);

// Start server with more resilience
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Press Ctrl+C to terminate');
});

// Improved error handling for the server
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Trying again with a different port.`);
    setTimeout(() => {
      server.close();
      server.listen(PORT + 1);
    }, 1000);
  } else {
    console.error('Server error:', err);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.close(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.close(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

// Force the event loop to stay alive in development
setInterval(() => {
  // Do nothing, but keep the process alive
  const now = new Date();
  if (process.env.NODE_ENV === 'development' && now.getSeconds() === 0) {
    // Only log once a minute to avoid excessive logging
    console.log(`Server still running - ${now.toLocaleTimeString()}`);
  }
}, 1000);

module.exports = app;