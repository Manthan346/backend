const config = {
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key',
  jwtExpire: '7d',
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/student_dashboard',
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = config;