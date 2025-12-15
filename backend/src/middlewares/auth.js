const jwt = require('jsonwebtoken');
const logger = require('../observability/logger');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn('Auth Middleware - No token provided', {
      route: req.path,
      ip: req.ip
    });
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      logger.warn('Auth Middleware - User not found', {
        userId: decoded.id,
        route: req.path
      });
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error) {
    logger.error('Auth Middleware - Token verification failed', {
      message: error.message,
      route: req.path,
      ip: req.ip
    });
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn('Auth Middleware - Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        route: req.path
      });
      return res.status(403).json({ success: false, message: 'Not authorized to access this route' });
    }
    next();
  };
};

module.exports = { protect, authorize };
