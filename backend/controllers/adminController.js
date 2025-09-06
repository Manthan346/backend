import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Test from '../models/Test.js';
import TestResult from '../models/TestResult.js';

export const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin already exists');
      return;
    }

    const admin = new User({
      name: 'System Admin',
      email: process.env.ADMIN_EMAIL || 'admin@placement.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });

    await admin.save();
    console.log('Admin created successfully');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

// GET /api/admin/teachers - TeacherManagement.jsx expects this endpoint
export const getAllTeachers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const filter = { role: 'teacher', isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const teachers = await User.find(filter)
      .populate('subjects', 'name code department')
      .select('-password')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      teachers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/admin/subjects - SubjectManagement.jsx expects this endpoint
export const getAllSubjects = async (req, res) => {
  try {
    const { department, search, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const subjects = await Subject.find(filter)
      .populate('teachers', 'name employeeId')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subject.countDocuments(filter);

    res.json({
      subjects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, department, search, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .populate('subjects', 'name code')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTeacher = async (req, res) => {
  try {
    const { name, email, password, employeeId, subjects } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const teacher = new User({
      name,
      email,
      password,
      employeeId,
      role: 'teacher',
      subjects: subjects || [],
      createdBy: req.user._id
    });

    await teacher.save();

    // Update subjects to include this teacher
    if (subjects && subjects.length > 0) {
      await Subject.updateMany(
        { _id: { $in: subjects } },
        { $addToSet: { teachers: teacher._id } }
      );
    }

    const populatedTeacher = await User.findById(teacher._id)
      .populate('subjects', 'name code')
      .select('-password');

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: populatedTeacher
    });
  } catch (error) {
    console.error('Create teacher error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { name, code, description, department, credits, teachers } = req.body;

    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({ message: 'Subject with this code already exists' });
    }

    const subject = new Subject({
      name,
      code: code.toUpperCase(),
      description,
      department,
      credits,
      teachers: teachers || [],
      createdBy: req.user._id
    });

    await subject.save();

    // Update teachers to include this subject
    if (teachers && teachers.length > 0) {
      await User.updateMany(
        { _id: { $in: teachers }, role: 'teacher' },
        { $addToSet: { subjects: subject._id } }
      );
    }

    const populatedSubject = await Subject.findById(subject._id)
      .populate('teachers', 'name employeeId')
      .populate('createdBy', 'name');

    res.status(201).json({
      message: 'Subject created successfully',
      subject: populatedSubject
    });
  } catch (error) {
    console.error('Create subject error:', error);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subject code already exists' });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.password; // Don't allow password updates through this endpoint

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting admin users
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    // Soft delete
    await User.findByIdAndUpdate(id, { isActive: false });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalSubjects = await Subject.countDocuments({ isActive: true });
    const totalTests = await Test.countDocuments({ isActive: true });

    const recentTests = await Test.find({ isActive: true })
      .populate('subject', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalSubjects,
        totalTests
      },
      recentTests
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
