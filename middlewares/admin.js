const admin = (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. Please login first.' });
    }

    // Check if user has admin role
   if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Admin or teacher privileges required' });
  }

  next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error in admin middleware' });
  }
};

module.exports = admin;