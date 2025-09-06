import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  remarks: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: Date
}, {
  timestamps: true
});

// Calculate percentage and grade before saving
testResultSchema.pre('save', async function(next) {
  if (this.isModified('marksObtained')) {
    // Populate test to get maxMarks
    await this.populate('test');

    this.percentage = (this.marksObtained / this.test.maxMarks) * 100;

    // Calculate grade based on percentage
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C+';
    else if (this.percentage >= 40) this.grade = 'C';
    else if (this.percentage >= 35) this.grade = 'D';
    else this.grade = 'F';

    // Check if passed
    this.isPassed = this.marksObtained >= this.test.passingMarks;
  }
  next();
});

// Compound index to ensure one result per student per test
testResultSchema.index({ test: 1, student: 1 }, { unique: true });

export default mongoose.model('TestResult', testResultSchema);
