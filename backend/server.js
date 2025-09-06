import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';  // Add this
import adminRoutes from './routes/admin.js';
import testRoutes from './routes/tests.js';
import subjectRoutes from './routes/subjects.js';

dotenv.config();

const app = express();

// CORS config (your existing one)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);  // Add this line
app.use('/api/admin', adminRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/subjects', subjectRoutes);

// ... rest of your server config
