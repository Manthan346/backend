import express from 'express';
import Subject from '../models/Subject.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all subjects - TestPage.jsx calls /admin/subjects but also needs /subjects
router.get('/', async (req, res) => {
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
});

// Get subject by ID
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('teachers', 'name employeeId email')
      .populate('createdBy', 'name');

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({ subject });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
