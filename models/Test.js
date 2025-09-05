const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    default: 'A'
  },
  testType: {
    type: String,
    enum: ['Quiz', 'Unit Test', 'Mid Term', 'Final Exam', 'Assignment'],
    default: 'Quiz'
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 1
  },
  passingMarks: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  testDate: {
    type: Date,
    required: true
  },
  instructions: {
    type: String
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for test performances
testSchema.virtual('performances', {
  ref: 'Performance',
  localField: '_id',
  foreignField: 'test'
});

testSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Test', testSchema);