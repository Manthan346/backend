import mongoose from 'mongoose';

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
  testType: {
    type: String,
    default: 'exam'
  },
  maxMarks: {
    type: Number,
    required: true,
    min: [1, 'Maximum marks must be at least 1']
  },
  passingMarks: {
    type: Number,
    required: true,
    min: [0, 'Passing marks must be at least 0']
    // REMOVED THE PROBLEMATIC VALIDATOR
  },
  testDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add a pre-save middleware for validation instead
testSchema.pre('save', function(next) {
  if (this.passingMarks > this.maxMarks) {
    const error = new Error('Passing marks cannot be greater than maximum marks');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Add a pre-update middleware for validation
testSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // If both maxMarks and passingMarks are being updated
  if (update.maxMarks !== undefined && update.passingMarks !== undefined) {
    if (update.passingMarks > update.maxMarks) {
      const error = new Error('Passing marks cannot be greater than maximum marks');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  // If only passingMarks is being updated, we need to check against existing maxMarks
  else if (update.passingMarks !== undefined) {
    // We'll handle this validation in the route instead
  }
  
  next();
});

export default mongoose.model('Test', testSchema);
