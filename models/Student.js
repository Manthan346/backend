const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  rollNo: {
    type: String,
    required: true,
    unique: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    default: 'A'
  },
  dateOfBirth: {
    type: Date
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  guardian: {
    name: String,
    phone: String,
    email: String
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for student's full performance data
studentSchema.virtual('performances', {
  ref: 'Performance',
  localField: '_id',
  foreignField: 'student'
});

studentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);