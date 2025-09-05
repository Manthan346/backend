const express = require('express');
const {
  login,
  getProfile,
  changePassword,
  loginValidation,
  changePasswordValidation
} = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, getProfile);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, changePasswordValidation, changePassword);

module.exports = router;