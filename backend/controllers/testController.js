import Test from '../models/Test.js';
import TestResult from '../models/TestResult.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';

export const getAllTests = async (req, res) => {
  try {
    const { subject, testType, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };
    if (subject) filter.subject = subject;
    if (testType) filter.testType = testType;

    // Teachers can only see tests for their subjects
    if (req.user.role === 'teacher') {
      const teacherSubjects = req.user.subjects;
      filter.subject = { $in: teacherSubjects };
    }

    const tests = await Test.find(filter)
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ testDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Test.countDocuments(filter);

    res.json({
      tests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('subject', 'name code department')
      .populate('createdBy', 'name role');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user has access to this test
    if (req.user.role === 'teacher' && !req.user.subjects.includes(test.subject._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ test });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTest = async (req, res) => {
  try {
    const {
      title,
      subject,
      testType,
      maxMarks,
      passingMarks,
      testDate,
      duration,
      description,
      instructions
    } = req.body;

    // Verify subject exists and user has access
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Teachers can only create tests for their subjects
    if (req.user.role === 'teacher' && !req.user.subjects.includes(subject)) {
      return res.status(403).json({ message: 'You can only create tests for your subjects' });
    }

    const test = new Test({
      title,
      subject,
      testType,
      maxMarks,
      passingMarks,
      testDate,
      duration,
      description,
      instructions,
      createdBy: req.user._id
    });

    await test.save();

    const populatedTest = await Test.findById(test._id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name');

    res.status(201).json({
      message: 'Test created successfully',
      test: populatedTest
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check permissions
    if (req.user.role === 'teacher' && test.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own tests' });
    }

    const updatedTest = await Test.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('subject', 'name code');

    res.json({
      message: 'Test updated successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check permissions
    if (req.user.role === 'teacher' && test.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own tests' });
    }

    // Soft delete
    await Test.findByIdAndUpdate(id, { isActive: false });

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTestResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check permissions
    if (req.user.role === 'teacher' && !req.user.subjects.includes(test.subject)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const results = await TestResult.find({ test: id })
      .populate('student', 'name rollNumber department year')
      .populate('gradedBy', 'name')
      .sort({ marksObtained: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TestResult.countDocuments({ test: id });

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      test: {
        title: test.title,
        maxMarks: test.maxMarks,
        passingMarks: test.passingMarks
      }
    });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/tests/:id/marks - MarksEntryModal.jsx expects this endpoint
export const addTestMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { marks } = req.body;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const results = [];
    const errors = [];

    for (const mark of marks) {
      try {
        const { studentId, marksObtained, remarks } = mark;

        // Check if result already exists
        const existingResult = await TestResult.findOne({ test: id, student: studentId });
        if (existingResult) {
          // Update existing result
          existingResult.marksObtained = marksObtained;
          existingResult.remarks = remarks;
          existingResult.gradedBy = req.user._id;
          existingResult.gradedAt = new Date();
          await existingResult.save();
          results.push(existingResult);
        } else {
          // Create new result
          const result = new TestResult({
            test: id,
            student: studentId,
            marksObtained,
            remarks,
            gradedBy: req.user._id,
            gradedAt: new Date()
          });
          await result.save();
          results.push(result);
        }
      } catch (error) {
        errors.push({ studentId: mark.studentId, error: error.message });
      }
    }

    res.json({
      message: 'Marks submitted successfully',
      results: results.length,
      errors
    });
  } catch (error) {
    console.error('Add test marks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
