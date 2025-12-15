const User = require('../models/User');
const logger = require('../observability/logger');
const metrics = require('../observability/metrics');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const signup = async (userData) => {
  try {
    const { firstName, lastName, email, password } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      metrics.authSignupTotal.inc({ status: 'failed' });
      metrics.authFailureTotal.inc({ reason: 'email_already_exists' });
      logger.warn('Signup - Email already exists', { email });
      throw new Error('Email already registered');
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    metrics.authSignupTotal.inc({ status: 'success' });
    logger.info('User signup successful', {
      userId: user._id,
      email: user.email
    });

    const token = generateToken(user._id);
    return {
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    metrics.authSignupTotal.inc({ status: 'failed' });
    metrics.authFailureTotal.inc({ reason: 'signup_error' });
    logger.error('Signup error', {
      message: error.message,
      email: userData.email
    });
    throw error;
  }
};

const login = async (email, password) => {
  try {
    if (!email || !password) {
      metrics.authLoginTotal.inc({ status: 'failed' });
      metrics.authFailureTotal.inc({ reason: 'missing_credentials' });
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      metrics.authLoginTotal.inc({ status: 'failed' });
      metrics.authFailureTotal.inc({ reason: 'user_not_found' });
      logger.warn('Login - User not found', { email });
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      metrics.authLoginTotal.inc({ status: 'failed' });
      metrics.authFailureTotal.inc({ reason: 'invalid_password' });
      logger.warn('Login - Invalid password', { email });
      throw new Error('Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    metrics.authLoginTotal.inc({ status: 'success' });
    logger.info('User login successful', {
      userId: user._id,
      email: user.email
    });

    const token = generateToken(user._id);
    return {
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    metrics.authLoginTotal.inc({ status: 'failed' });
    logger.error('Login error', {
      message: error.message,
      email
    });
    throw error;
  }
};

module.exports = {
  signup,
  login,
  generateToken
};
