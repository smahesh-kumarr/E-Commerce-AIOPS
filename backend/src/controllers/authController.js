const authService = require('../services/authService');
const logger = require('../observability/logger');

const signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const result = await authService.signup({
      firstName,
      lastName,
      email,
      password
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Signup controller error', {
      message: error.message,
      stack: error.stack
    });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Login controller error', {
      message: error.message,
      stack: error.stack
    });
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    logger.error('GetMe controller error', {
      message: error.message,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

module.exports = {
  signup,
  login,
  getMe
};
