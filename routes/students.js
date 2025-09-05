const express = require('express');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentPerformance,
  studentValidation
} = require('../controllers/studentController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students with pagination and filters
// @access  Private (Admin)
router.get('/', auth, admin, getAllStudents);

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', auth, getStudentById);

// @route   POST /api/students
// @desc    Create new student
// @access  Private (Admin)
router.post('/', auth, admin, studentValidation, createStudent);

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private (Admin)
router.put('/:id', auth, admin, studentValidation, updateStudent);

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Admin)
router.delete('/:id', auth, admin, deleteStudent);

// @route   GET /api/students/:id/performance
// @desc    Get student performance data
// @access  Private
router.get('/:id/performance', auth, getStudentPerformance);

module.exports = router;