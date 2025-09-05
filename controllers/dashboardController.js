const Student = require('../models/Student');
const Performance = require('../models/Performance');
const Test = require('../models/Test');
const Subject = require('../models/Subject');
const { generatePerformanceSummary, isValidObjectId } = require('../utils/helpers');

// Get student dashboard data
const getStudentDashboard = async (req, res) => {
  try {
    const { id } = req.params; // student id

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    // Get student info
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student performances with test and subject details
    const performances = await Performance.find({ student: id })
      .populate({
        path: 'test',
        populate: {
          path: 'subject',
          select: 'name code'
        }
      })
      .sort({ createdAt: -1 });

    // Generate performance summary
    const summary = generatePerformanceSummary(performances);

    // Get recent performances (last 5)
    const recentPerformances = performances.slice(0, 5);

    // Group performances by subject for subject-wise analysis
    const subjectWisePerformance = {};
    performances.forEach(performance => {
      const subjectName = performance.test.subject.name;
      if (!subjectWisePerformance[subjectName]) {
        subjectWisePerformance[subjectName] = [];
      }
      subjectWisePerformance[subjectName].push({
        testTitle: performance.test.title,
        percentage: performance.percentage,
        grade: performance.grade,
        testDate: performance.test.testDate
      });
    });

    // Calculate subject-wise averages
    const subjectAverages = Object.keys(subjectWisePerformance).map(subject => {
      const subjectPerfs = subjectWisePerformance[subject];
      const average = subjectPerfs.reduce((sum, perf) => sum + perf.percentage, 0) / subjectPerfs.length;
      return {
        subject,
        average: Math.round(average),
        totalTests: subjectPerfs.length
      };
    });

    // Get upcoming tests for this student's class
    const upcomingTests = await Test.find({
      class: student.class,
      testDate: { $gte: new Date() },
      isPublished: true
    })
      .populate('subject', 'name code')
      .sort({ testDate: 1 })
      .limit(5);

    // Performance trend data (last 10 tests for graph)
    const trendData = performances.slice(0, 10).reverse().map(perf => ({
      testTitle: perf.test.title,
      percentage: perf.percentage,
      date: perf.test.testDate,
      subject: perf.test.subject.name
    }));

    res.json({
      message: 'Student dashboard data retrieved successfully',
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        class: student.class,
        section: student.section
      },
      summary,
      recentPerformances,
      subjectAverages,
      upcomingTests,
      trendData,
      performanceData: {
        totalPerformances: performances.length,
        subjectWisePerformance
      }
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({ message: 'Server error retrieving dashboard data' });
  }
};

// Get class performance overview (for admin)
const getClassPerformance = async (req, res) => {
  try {
    const { class: className } = req.query;

    if (!className) {
      return res.status(400).json({ message: 'Class parameter is required' });
    }

    // Get all students in the class
    const students = await Student.find({ class: className, isActive: true });
    const studentIds = students.map(s => s._id);

    // Get all performances for students in this class
    const performances = await Performance.find({ student: { $in: studentIds } })
      .populate('student', 'name rollNo')
      .populate({
        path: 'test',
        populate: {
          path: 'subject',
          select: 'name code'
        }
      });

    // Calculate class statistics
    const classStats = {
      totalStudents: students.length,
      totalTests: await Test.countDocuments({ class: className }),
      averagePerformance: 0,
      topPerformers: [],
      subjectWiseAverage: {}
    };

    if (performances.length > 0) {
      // Overall class average
      const totalPercentage = performances.reduce((sum, perf) => sum + perf.percentage, 0);
      classStats.averagePerformance = Math.round(totalPercentage / performances.length);

      // Subject-wise class average
      const subjectGroups = {};
      performances.forEach(perf => {
        const subjectName = perf.test.subject.name;
        if (!subjectGroups[subjectName]) {
          subjectGroups[subjectName] = [];
        }
        subjectGroups[subjectName].push(perf.percentage);
      });

      Object.keys(subjectGroups).forEach(subject => {
        const scores = subjectGroups[subject];
        classStats.subjectWiseAverage[subject] = Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        );
      });

      // Top performers (students with highest average)
      const studentAverages = {};
      performances.forEach(perf => {
        if (!studentAverages[perf.student._id]) {
          studentAverages[perf.student._id] = {
            student: perf.student,
            scores: [],
            totalScore: 0
          };
        }
        studentAverages[perf.student._id].scores.push(perf.percentage);
        studentAverages[perf.student._id].totalScore += perf.percentage;
      });

      classStats.topPerformers = Object.values(studentAverages)
        .map(data => ({
          student: data.student,
          average: Math.round(data.totalScore / data.scores.length),
          totalTests: data.scores.length
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 5);
    }

    res.json({
      message: 'Class performance data retrieved successfully',
      class: className,
      classStats,
      performanceBreakdown: performances.length > 0 ? {
        excellent: performances.filter(p => p.percentage >= 90).length,
        good: performances.filter(p => p.percentage >= 70 && p.percentage < 90).length,
        average: performances.filter(p => p.percentage >= 50 && p.percentage < 70).length,
        needsImprovement: performances.filter(p => p.percentage < 50).length
      } : null
    });
  } catch (error) {
    console.error('Get class performance error:', error);
    res.status(500).json({ message: 'Server error retrieving class performance' });
  }
};

// Get overall dashboard stats (for admin)
const getOverallStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalTests = await Test.countDocuments();
    const totalSubjects = await Subject.countDocuments({ isActive: true });
    const totalPerformances = await Performance.countDocuments();

    // Recent activities
    const recentTests = await Test.find()
      .populate('subject', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPerformances = await Performance.find()
      .populate('student', 'name rollNo')
      .populate({
        path: 'test',
        populate: {
          path: 'subject',
          select: 'name'
        }
      })
      .sort({ gradedDate: -1 })
      .limit(5);

    res.json({
      message: 'Overall stats retrieved successfully',
      stats: {
        totalStudents,
        totalTests,
        totalSubjects,
        totalPerformances
      },
      recentActivities: {
        tests: recentTests,
        performances: recentPerformances
      }
    });
  } catch (error) {
    console.error('Get overall stats error:', error);
    res.status(500).json({ message: 'Server error retrieving stats' });
  }
};

module.exports = {
  getStudentDashboard,
  getClassPerformance,
  getOverallStats
};