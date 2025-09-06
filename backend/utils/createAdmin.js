import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

export const createInitialAdmin = async () => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('✅ Admin user already exists');
      return adminExists;
    }

    // Create initial admin
    const adminData = {
      name: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@placement.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Initial admin created successfully');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);

    return admin;
  } catch (error) {
    console.error('❌ Error creating initial admin:', error);
    throw error;
  }
};

export default createInitialAdmin;
