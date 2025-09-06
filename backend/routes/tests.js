import express from 'express';
import { body } from 'express-validator';
import {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getTestResults,
  addTestMarks
} from '../controllers/testController.js';
import Test from '../models/Test.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import { authenticate, teacherOrAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Test creation/update validation
const testValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('subject')
    .isMongoId()
    .withMessage('Valid subject ID is required'),
  body('testType')
    .isIn(['quiz', 'midterm', 'final', 'assignment'])
    .withMessage('Test type must be quiz, midterm, final, or assignment'),
  body('maxMarks')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max marks must be between 1 and 1000'),
  body('passingMarks')
    .isInt({ min: 0 })
    .withMessage('Passing marks must be a positive integer'),
  body('testDate')
    .isISO8601()
    .withMessage('Valid test date is required'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage('Duration must be between 1 and 300 minutes')
];

// GET - Get all tests
router.get('/', getAllTests);

// GET - Get test by ID
router.get('/:id', getTestById);

// POST - Create new test
router.post('/', teacherOrAdmin, testValidation, handleValidationErrors, createTest);

// PUT - Update test
router.put('/:id', teacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, testType, maxMarks, passingMarks, testDate, duration, description, instructions } = req.body;

    console.log('=== UPDATING TEST ===');
    console.log('Test ID:', id);
    console.log('Request body:', req.body);

    // Find the test
    const test = await Test.findById(id);
    if (!test) {
      console.log('Test not found:', id);
      return res.status(404).json({ message: 'Test not found' });
    }

    console.log('Current test:', test);

    // Check permissions - teachers can only update their own tests
    if (req.user.role === 'teacher' && test.createdBy.toString() !== req.user._id.toString()) {
      console.log('Permission denied - teacher trying to update another teacher\'s test');
      return res.status(403).json({ message: 'You can only update your own tests' });
    }

    // Verify subject exists and user has access
    if (subject && subject !== test.subject.toString()) {
      const subjectDoc = await Subject.findById(subject);
      if (!subjectDoc) {
        return res.status(404).json({ message: 'Subject not found' });
      }

      // Teachers can only update tests for their subjects
      if (req.user.role === 'teacher' && !req.user.subjects.includes(subject)) {
        return res.status(403).json({ message: 'You can only create tests for your subjects' });
      }
    }

    // Prepare update data
    const updateData = {
      title,
      subject,
      testType,
      maxMarks: parseInt(maxMarks),
      passingMarks: parseInt(passingMarks),
      testDate,
      duration: duration ? parseInt(duration) : test.duration,
      description,
      instructions
    };

    console.log('Update data:', updateData);

    // Update test
    const updatedTest = await Test.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('subject', 'name code').populate('createdBy', 'name');

    console.log('Updated test:', updatedTest);
    console.log('=== TEST UPDATE SUCCESSFUL ===');

    res.json({
      message: 'Test updated successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('=== TEST UPDATE ERROR ===');
    console.error('Error details:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid ID format' 
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE - Delete test
router.delete('/:id', teacherOrAdmin, deleteTest);

// Test results routes
router.get('/:id/results', teacherOrAdmin, getTestResults);
router.post('/:id/marks', teacherOrAdmin, addTestMarks);

export default router;
