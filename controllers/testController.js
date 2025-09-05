const Test = require('../models/Test');
const Performance = require('../models/Performance');
const Student = require('../models/Student');
const { isValidObjectId } = require('../utils/helpers');
const { body, validationResult } = require('express-validator');

// Get all tests
const getAllTests = async (req, res) => {
  try {
    const { page = 1, limit = 10, class: classFilter, subject, testType } = req.query;
    
    let query = {};
    
    // Add filters
    if (classFilter) query.class = classFilter;
    if (subject) query.subject = subject;
    if (testType) query.testType = testType;

    const tests = await Test.find(query)
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ testDate: -1 });

    const total = await Test.countDocuments(query);

    res.json({
      message: 'Tests retrieved successfully',
      tests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTests: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all tests error:', error);
    res.status(500).json({ message: 'Server error retrieving tests' });
  }
};

// Get single test
const getTestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid test ID' });
    }

    const test = await Test.findById(id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name email');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json({
      message: 'Test retrieved successfully',
      test
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ message: 'Server error retrieving test' });
  }
};

// Create new test
const createTest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const testData = {
      ...req.body,
      createdBy: req.user._id
    };

    const test = new Test(testData);
    await test.save();

    await test.populate('subject', 'name code');

    res.status(201).json({
      message: 'Test created successfully',
      test
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ message: 'Server error creating test' });
  }
};

// Update test
const updateTest = async (req, res) => {
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
      return res.status(400).json({ message: 'Invalid test ID' });
    }

    const test = await Test.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('subject', 'name code');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json({
      message: 'Test updated successfully',
      test
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ message: 'Server error updating test' });
  }
};

// Delete test
const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid test ID' });
    }

    const test = await Test.findByIdAndDelete(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Also delete associated performances
    await Performance.deleteMany({ test: id });

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ message: 'Server error deleting test' });
  }
};

// Submit/Update marks for students
const submitMarks = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params; // test id
    const { marks } = req.body; // array of {studentId, marksObtained, remarks}

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid test ID' });
    }

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const results = [];
    const errors_array = [];

    for (const mark of marks) {
      try {
        // Check if student exists
        const student = await Student.findById(mark.studentId);
        if (!student) {
          errors_array.push(`Student not found: ${mark.studentId}`);
          continue;
        }

        // Update or create performance record
        const performance = await Performance.findOneAndUpdate(
          { student: mark.studentId, test: id },
          {
            marksObtained: mark.marksObtained,
            remarks: mark.remarks || '',
            gradedBy: req.user._id,
            gradedDate: new Date()
          },
          { upsert: true, new: true, runValidators: true }
        );

        results.push({
          student: mark.studentId,
          performance
        });
      } catch (error) {
        console.error('Mark submission error for student:', mark.studentId, error);
        errors_array.push(`Error for student ${mark.studentId}: ${error.message}`);
      }
    }

    res.json({
      message: 'Marks submitted successfully',
      results,
      errors: errors_array.length > 0 ? errors_array : undefined
    });
  } catch (error) {
    console.error('Submit marks error:', error);
    res.status(500).json({ message: 'Server error submitting marks' });
  }
};

// Get test results
const getTestResults = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid test ID' });
    }

    const performances = await Performance.find({ test: id })
      .populate('student', 'name rollNo email')
      .populate('gradedBy', 'name')
      .sort({ 'student.rollNo': 1 });

    const test = await Test.findById(id).populate('subject', 'name code');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Calculate statistics
    const stats = {
      totalStudents: performances.length,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passedCount: 0
    };

    if (performances.length > 0) {
      const scores = performances.map(p => p.percentage);
      stats.averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      stats.highestScore = Math.max(...scores);
      stats.lowestScore = Math.min(...scores);
      stats.passedCount = performances.filter(p => p.marksObtained >= test.passingMarks).length;
    }

    res.json({
      message: 'Test results retrieved successfully',
      test,
      performances,
      stats
    });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ message: 'Server error retrieving test results' });
  }
};

// Validation rules
const testValidation = [
  body('title').trim().isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),
  body('subject').isMongoId().withMessage('Valid subject ID is required'),
  body('class').trim().notEmpty().withMessage('Class is required'),
  body('maxMarks').isInt({ min: 1 }).withMessage('Max marks must be a positive number'),
  body('passingMarks').isInt({ min: 0 }).withMessage('Passing marks must be a non-negative number'),
  body('testDate').isISO8601().withMessage('Valid test date is required')
];

const marksValidation = [
  body('marks').isArray({ min: 1 }).withMessage('Marks array is required'),
  body('marks.*.studentId').isMongoId().withMessage('Valid student ID is required'),
  body('marks.*.marksObtained').isNumeric({ min: 0 }).withMessage('Marks obtained must be non-negative')
];

module.exports = {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  submitMarks,
  getTestResults,
  testValidation,
  marksValidation
};