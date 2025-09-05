// Grade calculation helper
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
};

// Generate student performance summary
const generatePerformanceSummary = (performances) => {
  if (!performances.length) {
    return {
      totalTests: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passedTests: 0,
      failedTests: 0
    };
  }

  const scores = performances.map(p => p.percentage);
  const passed = performances.filter(p => p.percentage >= 33).length;

  return {
    totalTests: performances.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    passedTests: passed,
    failedTests: performances.length - passed
  };
};

// Format date for consistent output
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Validate ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Generate JWT token
const generateToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
  calculateGrade,
  generatePerformanceSummary,
  formatDate,
  isValidObjectId,
  generateToken
};