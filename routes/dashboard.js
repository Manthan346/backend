const express = require('express');
const {
  getStudentDashboard,
  getClassPerformance,
  getOverallStats
} = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// @route   GET /api/dashboard/student/:id
// @desc    Get student dashboard data with performance analytics
// @access  Private
router.get('/student/:id', auth, getStudentDashboard);

// @route   GET /api/dashboard/class
// @desc    Get class performance overview
// @access  Private (Admin)
router.get('/class', auth, admin, getClassPerformance);

// @route   GET /api/dashboard/stats
// @desc    Get overall dashboard statistics
// @access  Private (Admin)
router.get('/stats', auth, admin, getOverallStats);

module.exports = router;