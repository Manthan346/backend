import express from 'express';
import User from '../models/User.js';
import TestResult from '../models/TestResult.js';
import Test from '../models/Test.js';
import { authenticate, teacherOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get teacher dashboard
router.get('/dashboard', teacherOrAdmin, async (req, res) => {
  try {
    const teacherId = req.user._id;

    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get teacher's subjects
    const teacher = await User.findById(teacherId).populate('subjects', 'name code');
    const subjectIds = teacher.subjects.map(s => s._id);

    // Get recent tests created by teacher
    const recentTests = await Test.find({
      $or: [
        { createdBy: teacherId },
        { subject: { $in: subjectIds } }
      ],
      isActive: true
    })
      .populate('subject', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming tests
    const upcomingTests = await Test.find({
      subject: { $in: subjectIds },
      testDate: { $gte: new Date() },
      isActive: true
    })
      .populate('subject', 'name code')
      .sort({ testDate: 1 })
      .limit(5);

    // Get statistics
    const totalTests = await Test.countDocuments({
      subject: { $in: subjectIds },
      isActive: true
    });

    const totalStudents = await User.countDocuments({
      role: 'student',
      isActive: true
    });

    // Get pending results (tests without all student results)
    const allTests = await Test.find({
      subject: { $in: subjectIds },
      isActive: true
    });

    let pendingGrading = 0;
    for (const test of allTests) {
      const resultCount = await TestResult.countDocuments({ test: test._id });
      if (resultCount < totalStudents) {
        pendingGrading++;
      }
    }

    res.json({
      teacher: teacher.toJSON(),
      recentTests,
      upcomingTests,
      stats: {
        totalTests,
        totalStudents,
        pendingGrading,
        totalSubjects: teacher.subjects.length
      }
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all teachers (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { department, search, page = 1, limit = 10 } = req.query;

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
});

export default router;
