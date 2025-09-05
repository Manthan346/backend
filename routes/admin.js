const express = require('express');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// @route   POST /api/admin/create-user
// @desc    Create new admin/teacher user
// @access  Private (Admin)
router.post('/create-user', auth, admin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'teacher']).withMessage('Role must be admin or teacher')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', auth, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      message: 'Users retrieved successfully',
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
});

// @route   POST /api/admin/subjects
// @desc    Create new subject
// @access  Private (Admin)
router.post('/subjects', auth, admin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Subject name must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Subject code must be at least 2 characters'),
  body('class').trim().notEmpty().withMessage('Class is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const subject = new Subject(req.body);
    await subject.save();

    res.status(201).json({
      message: 'Subject created successfully',
      subject
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Subject with this code already exists' 
      });
    }
    console.error('Create subject error:', error);
    res.status(500).json({ message: 'Server error creating subject' });
  }
});

// @route   GET /api/admin/subjects
// @desc    Get all subjects
// @access  Private
router.get('/subjects', auth, async (req, res) => {
  try {
    const { class: classFilter } = req.query;
    let query = {};
    
    if (classFilter) query.class = classFilter;

    const subjects = await Subject.find(query).sort({ name: 1 });
    res.json({
      message: 'Subjects retrieved successfully',
      subjects
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error retrieving subjects' });
  }
});

// @route   PUT /api/admin/subjects/:id
// @desc    Update subject
// @access  Private (Admin)
router.put('/subjects/:id', auth, admin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Subject name must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Subject code must be at least 2 characters'),
  body('class').trim().notEmpty().withMessage('Class is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const subject = await Subject.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({
      message: 'Subject updated successfully',
      subject
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Subject with this code already exists' 
      });
    }
    console.error('Update subject error:', error);
    res.status(500).json({ message: 'Server error updating subject' });
  }
});

// @route   DELETE /api/admin/subjects/:id
// @desc    Delete subject
// @access  Private (Admin)
router.delete('/subjects/:id', auth, admin, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error deleting subject' });
  }
});

module.exports = router;