import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getAllTeachers,
  getAllSubjects,
  createTeacher,
  createSubject,
  getDashboardStats
} from '../controllers/adminController.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(adminOnly);

// ================================
// VALIDATION MIDDLEWARE
// ================================

// Teacher creation/update validation
const teacherValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('employeeId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Employee ID is required'),
  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array')
];

// Subject creation/update validation
const subjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject name must be between 2 and 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Subject code must be between 2 and 20 characters'),
  body('department')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Department is required'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
  body('teachers')
    .optional()
    .isArray()
    .withMessage('Teachers must be an array')
];

// ================================
// GET ROUTES
// ================================

// Get all users
router.get('/users', getAllUsers);

// Get all teachers (for TeacherManagement.jsx)
router.get('/teachers', getAllTeachers);

// Get all subjects (for SubjectManagement.jsx)
router.get('/subjects', getAllSubjects);

// Get dashboard statistics
router.get('/dashboard', getDashboardStats);

// ================================
// POST ROUTES (Create)
// ================================

// Create new teacher
router.post('/teachers', teacherValidation, handleValidationErrors, createTeacher);

// Create new subject
router.post('/subjects', subjectValidation, handleValidationErrors, createSubject);

// ================================
// PUT ROUTES (Update)
// ================================

// Update user/teacher
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, employeeId, subjects, ...otherUpdates } = req.body;

    console.log('=== UPDATING USER ===');
    console.log('User ID:', id);
    console.log('Request body:', req.body);

    // Find the user first
    const user = await User.findById(id);
    if (!user) {
      console.log('User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Current user:', user);

    // Prepare update data
    const updateData = { name, email, employeeId, ...otherUpdates };
    
    // Only update password if provided and not empty
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    // Handle subjects for teachers
    if (user.role === 'teacher' && Array.isArray(subjects)) {
      console.log('Updating teacher subjects from', user.subjects, 'to', subjects);
      
      // Remove teacher from previous subjects
      await Subject.updateMany(
        { teachers: id },
        { $pull: { teachers: id } }
      );

      // Add teacher to new subjects
      if (subjects.length > 0) {
        await Subject.updateMany(
          { _id: { $in: subjects } },
          { $addToSet: { teachers: id } }
        );
      }

      updateData.subjects = subjects;
    }

    console.log('Update data:', updateData);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('subjects', 'name code').select('-password');

    console.log('Updated user:', updatedUser);
    console.log('=== UPDATE SUCCESSFUL ===');

    res.json({ 
      message: `${user.role === 'teacher' ? 'Teacher' : 'User'} updated successfully`, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('=== UPDATE USER ERROR ===');
    console.error('Error details:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {});
      return res.status(400).json({ 
        message: `${field || 'Field'} already exists` 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update subject
router.put('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, department, credits, teachers } = req.body;

    console.log('=== UPDATING SUBJECT ===');
    console.log('Subject ID:', id);
    console.log('Request body:', req.body);

    const subject = await Subject.findById(id);
    if (!subject) {
      console.log('Subject not found:', id);
      return res.status(404).json({ message: 'Subject not found' });
    }

    console.log('Current subject:', subject);

    // Remove this subject from all previous teachers
    await User.updateMany(
      { subjects: id },
      { $pull: { subjects: id } }
    );

    // Prepare update data
    const updateData = {
      name,
      description,
      department,
      credits: parseInt(credits) || 3,
      teachers: Array.isArray(teachers) ? teachers : []
    };

    // Handle code update carefully to avoid unique constraint issues
    if (code && code.toUpperCase() !== subject.code.toUpperCase()) {
      console.log('Updating subject code from', subject.code, 'to', code);
      
      // Check if new code already exists
      const existingSubject = await Subject.findOne({ 
        code: code.toUpperCase(), 
        _id: { $ne: id },
        isActive: true 
      });
      
      if (existingSubject) {
        console.log('Code conflict:', code);
        return res.status(400).json({ message: 'Subject code already exists' });
      }
      
      updateData.code = code.toUpperCase();
    }

    console.log('Update data:', updateData);

    // Update subject
    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('teachers', 'name employeeId');

    console.log('Updated subject:', updatedSubject);

    // Add this subject to new teachers
    if (teachers && teachers.length > 0) {
      console.log('Adding subject to teachers:', teachers);
      await User.updateMany(
        { _id: { $in: teachers }, role: 'teacher' },
        { $addToSet: { subjects: id } }
      );
    }

    console.log('=== SUBJECT UPDATE SUCCESSFUL ===');
    
    res.json({
      message: 'Subject updated successfully',
      subject: updatedSubject
    });
  } catch (error) {
    console.error('=== SUBJECT UPDATE ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {});
      return res.status(400).json({ 
        message: `${field || 'Subject code'} already exists` 
      });
    }
    
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

// ================================
// DELETE ROUTES
// ================================

// Delete user/teacher
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== DELETING USER ===');
    console.log('User ID:', id);

    const user = await User.findById(id);
    if (!user) {
      console.log('User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User to delete:', user);

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      console.log('Attempted to delete admin user');
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    // Remove teacher from subjects if they are a teacher
    if (user.role === 'teacher') {
      console.log('Removing teacher from subjects');
      await Subject.updateMany(
        { teachers: id },
        { $pull: { teachers: id } }
      );
    }

    // Soft delete (set isActive to false)
    await User.findByIdAndUpdate(id, { isActive: false });

    console.log('=== USER DELETED SUCCESSFULLY ===');
    
    res.json({ 
      message: `${user.role === 'teacher' ? 'Teacher' : 'User'} deleted successfully` 
    });
  } catch (error) {
    console.error('=== DELETE USER ERROR ===');
    console.error('Error details:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete subject
router.delete('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== DELETING SUBJECT ===');
    console.log('Subject ID:', id);

    const subject = await Subject.findById(id);
    if (!subject) {
      console.log('Subject not found:', id);
      return res.status(404).json({ message: 'Subject not found' });
    }

    console.log('Subject to delete:', subject);

    // Remove subject from all teachers
    console.log('Removing subject from teachers');
    await User.updateMany(
      { subjects: id },
      { $pull: { subjects: id } }
    );

    // Soft delete (set isActive to false)
    await Subject.findByIdAndUpdate(id, { isActive: false });

    console.log('=== SUBJECT DELETED SUCCESSFULLY ===');
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('=== DELETE SUBJECT ERROR ===');
    console.error('Error details:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
