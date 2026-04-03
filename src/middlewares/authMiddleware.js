const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

// JWT secret should be in .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';


// Generate JWT token for user
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};


// Verify JWT token

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// This middleware verifies the JWT token and attaches the user to the request
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route. Please provide a valid token.'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please login again.'
      });
    }
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Invalid token.'
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Your account is inactive. Please contact administrator.'
      });
    }
    
    // Attach user to request object
    req.user = user;
    next();
    
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// This middleware must be used after the protect middleware

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role ${req.user.role} is not authorized to access this resource. Required roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  protect,
  authorize,
  // JWT_SECRET
};