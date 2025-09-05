const express = require('express');
const {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  submitMarks,
  getTestResults,
  testValidation,
  marksValidation
} = require('../controllers/testController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// @route   GET /api/tests
// @desc    Get all tests with pagination and filters
// @access  Private
router.get('/', auth, getAllTests);

// @route   GET /api/tests/:id
// @desc    Get test by ID
// @access  Private
router.get('/:id', auth, getTestById);

// @route   POST /api/tests
// @desc    Create new test
// @access  Private (Admin)
router.post('/', auth, admin, testValidation, createTest);

// @route   PUT /api/tests/:id
// @desc    Update test
// @access  Private (Admin)
router.put('/:id', auth, admin, testValidation, updateTest);

// @route   DELETE /api/tests/:id
// @desc    Delete test
// @access  Private (Admin)
router.delete('/:id', auth, admin, deleteTest);

// @route   POST /api/tests/:id/marks
// @desc    Submit/Update marks for a test
// @access  Private (Admin)
router.post('/:id/marks', auth, admin, marksValidation, submitMarks);

// @route   GET /api/tests/:id/results
// @desc    Get test results and statistics
// @access  Private
router.get('/:id/results', auth, getTestResults);

module.exports = router;