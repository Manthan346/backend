const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
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
  remarks: {
    type: String
  },
  submittedDate: {
    type: Date,
    default: Date.now
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate percentage before saving
performanceSchema.pre('save', async function(next) {
  if (this.isModified('marksObtained')) {
    try {
      const test = await mongoose.model('Test').findById(this.test);
      if (test) {
        this.percentage = (this.marksObtained / test.maxMarks) * 100;
        
        // Calculate grade based on percentage
        if (this.percentage >= 90) this.grade = 'A+';
        else if (this.percentage >= 80) this.grade = 'A';
        else if (this.percentage >= 70) this.grade = 'B+';
        else if (this.percentage >= 60) this.grade = 'B';
        else if (this.percentage >= 50) this.grade = 'C+';
        else if (this.percentage >= 40) this.grade = 'C';
        else if (this.percentage >= 33) this.grade = 'D';
        else this.grade = 'F';
      }
    } catch (error) {
      console.error('Error calculating percentage:', error);
    }
  }
  next();
});

// Compound index for unique student-test combination
performanceSchema.index({ student: 1, test: 1 }, { unique: true });

module.exports = mongoose.model('Performance', performanceSchema);