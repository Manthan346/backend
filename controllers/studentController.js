const Student = require('../models/Student');
const Performance = require('../models/Performance');
const { generatePerformanceSummary, isValidObjectId } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, class: classFilter, search } = req.query;
    
    let query = {};
    
    // Add class filter
    if (classFilter) query.class = classFilter;
    
    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Student.countDocuments(query);

    res.json({
      message: 'Students retrieved successfully',
      students,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStudents: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ message: 'Server error retrieving students' });
  }
};

// Get single student
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'Student retrieved successfully',
      student
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error retrieving student' });
  }
};

// Create new student
const createStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const student = new Student(req.body);
    await student.save();

    res.status(201).json({
      message: 'Student created successfully',
      student
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `Student with this ${field} already exists` 
      });
    }
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error creating student' });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const student = await Student.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `Student with this ${field} already exists` 
      });
    }
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error updating student' });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Also delete associated performances
    await Performance.deleteMany({ student: id });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error deleting student' });
  }
};

// Get student performance
const getStudentPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const performances = await Performance.find({ student: id })
      .populate('test', 'title subject testType maxMarks testDate')
      .populate('test.subject', 'name code')
      .sort({ 'test.testDate': -1 });

    const summary = generatePerformanceSummary(performances);

    res.json({
      message: 'Student performance retrieved successfully',
      performances,
      summary
    });
  } catch (error) {
    console.error('Get student performance error:', error);
    res.status(500).json({ message: 'Server error retrieving performance' });
  }
};

// Validation rules
const studentValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('rollNo').trim().notEmpty().withMessage('Roll number is required'),
  body('class').trim().notEmpty().withMessage('Class is required')
];

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentPerformance,
  studentValidation
};