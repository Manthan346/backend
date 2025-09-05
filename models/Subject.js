const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String
  },
  class: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    default: 1
  },
  teacher: {
    name: String,
    email: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);