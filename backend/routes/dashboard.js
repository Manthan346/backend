import express from 'express';
import User from '../models/User.js';
import Test from '../models/Test.js';
import Subject from '../models/Subject.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(authenticate);

// Student Dashboard Route
router.get('/student/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== STUDENT DASHBOARD REQUEST ===');
    console.log('Student ID:', id);
    console.log('Requesting user:', req.user.id, 'Role:', req.user.role);

    // Check if user can access this dashboard
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own dashboard.'
      });
    }

    // Get student details
    const student = await User.findById(id)
      .select('-password')
      .populate('subjects', 'name code');

    if (!student) {
      return res.status(404).json({
        message: 'Student not found'
      });
    }

    if (student.role !== 'student') {
      return res.status(400).json({
        message: 'User is not a student'
      });
    }

    // Get subjects for the student's department/year
    const subjects = await Subject.find({
      isActive: true,
      $or: [
        { department: student.department },
        { isGlobal: true } // If you have global subjects
      ]
    }).populate('teachers', 'name employeeId');

    // Get tests for student's subjects
    const subjectIds = subjects.map(s => s._id);
    const tests = await Test.find({
      subject: { $in: subjectIds },
      isActive: true
    }).populate('subject', 'name code').sort({ testDate: -1 });

    // Get test results for this student (you'll need to create TestResult model)
    // For now, we'll return empty results
    const testResults = [];

    // Calculate statistics
    const stats = {
      totalSubjects: subjects.length,
      totalTests: tests.length,
      completedTests: testResults.length,
      averageGrade: testResults.length > 0 ? 'B+' : 'N/A',
      upcomingTests: tests.filter(t => new Date(t.testDate) > new Date()).length
    };

    console.log('✅ Student dashboard data prepared');

    res.json({
      message: 'Student dashboard data',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year
      },
      stats,
      subjects,
      recentTests: tests.slice(0, 5), // Last 5 tests
      upcomingTests: tests.filter(t => new Date(t.testDate) > new Date()).slice(0, 3),
      testResults
    });

  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      message: 'Error loading student dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Teacher Dashboard Route
router.get('/teacher/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== TEACHER DASHBOARD REQUEST ===');
    console.log('Teacher ID:', id);

    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Get teacher details
    const teacher = await User.findById(id)
      .select('-password')
      .populate('subjects', 'name code');

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({
        message: 'Teacher not found'
      });
    }

    // Get teacher's subjects
    const subjects = await Subject.find({
      teachers: id,
      isActive: true
    });

    // Get teacher's tests
    const tests = await Test.find({
      createdBy: id,
      isActive: true
    }).populate('subject', 'name code').sort({ testDate: -1 });

    // Get students count for teacher's subjects
    const studentCount = await User.countDocuments({
      role: 'student',
      isActive: true,
      // You might want to filter by subjects or department
    });

    const stats = {
      totalSubjects: subjects.length,
      totalTests: tests.length,
      totalStudents: studentCount,
      upcomingTests: tests.filter(t => new Date(t.testDate) > new Date()).length
    };

    res.json({
      message: 'Teacher dashboard data',
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        employeeId: teacher.employeeId
      },
      stats,
      subjects,
      recentTests: tests.slice(0, 5),
      upcomingTests: tests.filter(t => new Date(t.testDate) > new Date()).slice(0, 3)
    });

  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({
      message: 'Error loading teacher dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin Dashboard Route
router.get('/admin', async (req, res) => {
  try {
    console.log('=== ADMIN DASHBOARD REQUEST ===');

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required'
      });
    }

    // Get counts
    const [studentCount, teacherCount, subjectCount, testCount] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Subject.countDocuments({ isActive: true }),
      Test.countDocuments({ isActive: true })
    ]);

    // Get recent activities
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    const recentTests = await Test.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('subject', 'name code')
      .populate('createdBy', 'name');

    const stats = {
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      totalSubjects: subjectCount,
      totalTests: testCount,
      totalUsers: studentCount + teacherCount
    };

    res.json({
      message: 'Admin dashboard data',
      stats,
      recentUsers,
      recentTests
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      message: 'Error loading admin dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// General Dashboard Route (determines user type and redirects)
router.get('/', async (req, res) => {
  try {
    const { id, role } = req.user;
    
    console.log('=== GENERAL DASHBOARD REQUEST ===');
    console.log('User ID:', id, 'Role:', role);

    // Redirect based on role
    switch (role) {
      case 'student':
        // You can either redirect or fetch data directly
        return res.json({
          message: 'Redirecting to student dashboard',
          redirectTo: `/api/dashboard/student/${id}`,
          userRole: 'student'
        });
        
      case 'teacher':
        return res.json({
          message: 'Redirecting to teacher dashboard',
          redirectTo: `/api/dashboard/teacher/${id}`,
          userRole: 'teacher'
        });
        
      case 'admin':
        return res.json({
          message: 'Redirecting to admin dashboard',
          redirectTo: '/api/dashboard/admin',
          userRole: 'admin'
        });
        
      default:
        return res.status(400).json({
          message: 'Unknown user role'
        });
    }

  } catch (error) {
    console.error('Dashboard route error:', error);
    res.status(500).json({
      message: 'Error loading dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
