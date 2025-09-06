import express from 'express';
import { 
  getAllStudents, 
  getStudentDashboard, 
  getStudentResults, 
  getStudentPerformance 
} from '../controllers/studentController.js';
import { authenticate, studentOnly, teacherOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Routes matching frontend expectations
router.get('/', getAllStudents);  // MarksEntryModal.jsx expects this endpoint
router.get('/dashboard', studentOnly, getStudentDashboard);
router.get('/results', studentOnly, getStudentResults);
router.get('/:id/performance', teacherOrAdmin, getStudentPerformance);

export default router;
