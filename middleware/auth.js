const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
require('dotenv').config();

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  try {
    // Extract token from cookie or authorization header
    const token = req.cookies.token || 
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
        ? req.headers.authorization.split(' ')[1] 
        : null);

    // Check if token exists
    if (!token) {
      req.flash('error', 'Authentication required. Please log in.');
      
      if (req.xhr || req.path.startsWith('/api')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      return res.redirect('/login');
    }

    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'default-jwt-secret-change-in-production'
      );
      
      console.log('JWT verified successfully for user:', decoded.id);
      
      // If token verification succeeds, set up the session
      req.session.userId = decoded.id;
      req.session.username = decoded.username;
      req.user = decoded;
      
      // Save the session explicitly
      req.session.save(err => {
        if (err) {
          console.error('Session save error in auth middleware:', err);
        }
        return next();
      });
    } catch (tokenError) {
      // Specific handling for token verification errors
      if (tokenError.name === 'TokenExpiredError') {
        console.log('Token expired:', tokenError);
        req.flash('error', 'Your session has expired. Please log in again.');
      } else {
        console.error('Token verification error:', tokenError);
        req.flash('error', 'Authentication failed. Please log in again.');
      }
      
      res.clearCookie('token');
      
      if (req.xhr || req.path.startsWith('/api')) {
        return res.status(401).json({ error: 'Authentication failed' });
      } else {
        return res.redirect('/login');
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    req.flash('error', 'Server error during authentication');
    
    if (req.xhr || req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Server error' });
    } else {
      return res.redirect('/login');
    }
  }
};

// Middleware to check if the user is a guest (not logged in)
const isGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    console.log('Redirecting authenticated user to dashboard');
    return res.redirect('/dashboard');
  }
  next();
};

module.exports = { isAuthenticated, isGuest };