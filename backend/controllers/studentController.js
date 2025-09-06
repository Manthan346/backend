import TestResult from '../models/TestResult.js';
import Test from '../models/Test.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// GET /api/students - MarksEntryModal.jsx expects this endpoint
export const getAllStudents = async (req, res) => {
  try {
    const { department, year, search, page = 1, limit = 10 } = req.query;

    const filter = { role: 'student', isActive: true };
    if (department) filter.department = department;
    if (year) filter.year = parseInt(year);
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(filter)
      .select('-password')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get student dashboard data
export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get recent test results
    const recentResults = await TestResult.find({ student: studentId })
      .populate({
        path: 'test',
        populate: {
          path: 'subject',
          select: 'name code'
        }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming tests (for student's department)
    const upcomingTests = await Test.find({
      testDate: { $gte: new Date() },
      isActive: true
    })
      .populate('subject', 'name code department')
      .sort({ testDate: 1 })
      .limit(5);

    // Calculate overall performance
    const allResults = await TestResult.find({ student: studentId })
      .populate('test', 'maxMarks passingMarks');

    let totalMarks = 0;
    let totalMaxMarks = 0;
    let passedTests = 0;
    let totalTests = allResults.length;

    allResults.forEach(result => {
      totalMarks += result.marksObtained;
      totalMaxMarks += result.test.maxMarks;
      if (result.isPassed) passedTests++;
    });

    const overallPercentage = totalTests > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    res.json({
      recentResults,
      upcomingTests,
      performance: {
        overallPercentage: parseFloat(overallPercentage.toFixed(2)),
        passRate: parseFloat(passRate.toFixed(2)),
        totalTests,
        passedTests
      }
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get student's test results
export const getStudentResults = async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, testType } = req.query;

    const filter = { student: req.user._id };

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'tests',
          localField: 'test',
          foreignField: '_id',
          as: 'test'
        }
      },
      { $unwind: '$test' },
      {
        $lookup: {
          from: 'subjects',
          localField: 'test.subject',
          foreignField: '_id',
          as: 'test.subject'
        }
      },
      { $unwind: '$test.subject' }
    ];

    // Add filters
    if (subject) {
      pipeline.push({ $match: { 'test.subject._id': new mongoose.Types.ObjectId(subject) } });
    }
    if (testType) {
      pipeline.push({ $match: { 'test.testType': testType } });
    }

    // Sort and paginate
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    );

    const results = await TestResult.aggregate(pipeline);
    const total = await TestResult.countDocuments(filter);

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get student performance by ID (for teachers and admin)
export const getStudentPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findOne({ _id: id, role: 'student' })
      .select('-password');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get all test results for this student
    const results = await TestResult.find({ student: id })
      .populate({
        path: 'test',
        populate: {
          path: 'subject',
          select: 'name code'
        }
      })
      .sort({ createdAt: -1 });

    // Calculate subject-wise performance
    const subjectPerformance = {};
    results.forEach(result => {
      const subjectId = result.test.subject._id.toString();
      if (!subjectPerformance[subjectId]) {
        subjectPerformance[subjectId] = {
          subject: result.test.subject,
          totalMarks: 0,
          totalMaxMarks: 0,
          totalTests: 0,
          passedTests: 0,
          results: []
        };
      }

      const perf = subjectPerformance[subjectId];
      perf.totalMarks += result.marksObtained;
      perf.totalMaxMarks += result.test.maxMarks;
      perf.totalTests++;
      if (result.isPassed) perf.passedTests++;
      perf.results.push(result);
    });

    // Calculate percentages
    Object.keys(subjectPerformance).forEach(subjectId => {
      const perf = subjectPerformance[subjectId];
      perf.percentage = perf.totalMaxMarks > 0 ? (perf.totalMarks / perf.totalMaxMarks) * 100 : 0;
      perf.passRate = perf.totalTests > 0 ? (perf.passedTests / perf.totalTests) * 100 : 0;
    });

    res.json({
      student,
      overallResults: results,
      subjectPerformance: Object.values(subjectPerformance)
    });
  } catch (error) {
    console.error('Get student performance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
