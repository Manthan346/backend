import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  console.log('Auth test route hit');
  res.json({ message: 'Auth routes are working!' });
});

// Register route
router.post('/register', async (req, res) => {
  try {
    console.log('=== REGISTER REQUEST ===');
    console.log('Body received:', req.body);
    
    const { name, email, password, role, employeeId, rollNumber, department, year } = req.body;

    // Validation
    if (!name?.trim() || !email?.trim() || !password || !role) {
      console.log('Missing required fields');
      return res.status(400).json({
        message: 'Name, email, password, and role are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Hash password with salt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create user data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      isActive: true
    };

    // Add role-specific fields
    if (role === 'teacher' && employeeId) {
      userData.employeeId = employeeId.trim();
    }
    
    if (role === 'student') {
      if (rollNumber) userData.rollNumber = rollNumber.trim();
      if (department) userData.department = department.trim();
      if (year) userData.year = parseInt(year);
    }

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });

    // Create user
    const user = new User(userData);
    await user.save();

    console.log('✅ User created successfully:', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_secret_key_change_this',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('=== REGISTER ERROR ===');
    console.error('Error details:', error);
    
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern);
      return res.status(400).json({
        message: `${duplicateField} already exists`
      });
    }
    
    res.status(500).json({
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login route with detailed logging
router.post('/login', async (req, res) => {
  try {
    console.log('=== LOGIN REQUEST ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('Login attempt for email:', req.body.email);
    console.log('Request body keys:', Object.keys(req.body));
    
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      console.log('❌ Missing email or password');
      console.log('Email provided:', !!email);
      console.log('Password provided:', !!password);
      return res.status(400).json({
        message: 'Email and password are required',
        received: { email: !!email, password: !!password }
      });
    }

    console.log('✅ Input validation passed');

    // Find user in database
    console.log('Searching for user with email:', email.toLowerCase().trim());
    
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });

    if (!user) {
      console.log('❌ User not found in database');
      console.log('Searched email:', email.toLowerCase().trim());
      
      // Check if user exists but is inactive
      const inactiveUser = await User.findOne({ 
        email: email.toLowerCase().trim(),
        isActive: false 
      });
      
      if (inactiveUser) {
        console.log('User found but inactive');
        return res.status(401).json({
          message: 'Account is deactivated. Please contact admin.'
        });
      }
      
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    console.log('✅ User found in database');
    console.log('User details:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hashedPasswordLength: user.password?.length
    });

    // Compare password
    console.log('🔐 Comparing passwords...');
    console.log('Provided password length:', password.length);
    console.log('Stored hash length:', user.password?.length);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Password comparison failed');
      console.log('This could mean:');
      console.log('1. Wrong password entered');
      console.log('2. Password not hashed correctly during registration');
      console.log('3. bcrypt version mismatch');
      
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Password comparison successful');

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'default_secret_key_change_this',
      { expiresIn: '7d' }
    );

    console.log('✅ JWT token generated successfully');
    console.log('=== LOGIN SUCCESSFUL ===');
    console.log('User logged in:', user.email, 'Role:', user.role);

    // Send success response
    res.json({
      message: 'Login successful',
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.employeeId && { employeeId: user.employeeId }),
        ...(user.rollNumber && { rollNumber: user.rollNumber }),
        ...(user.department && { department: user.department }),
        ...(user.year && { year: user.year })
      },
      token
    });

  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
