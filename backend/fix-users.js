const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Delete existing users
    await User.deleteMany({ email: { $in: ['admin@sportkits.com', 'user@sportkits.com'] } });
    console.log('Deleted old users');
    
    // Create admin with hashed password
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@sportkits.com',
      password: 'Admin@123',
      role: 'admin',
      status: 'active'
    });
    console.log('Admin created:', admin.email);
    
    // Create user with hashed password
    const user = await User.create({
      name: 'Regular User',
      email: 'user@sportkits.com',
      password: 'User@123',
      role: 'user',
      status: 'active'
    });
    console.log('User created:', user.email);
    
    // Test password
    const testUser = await User.findOne({ email: 'admin@sportkits.com' }).select('+password');
    const isMatch = await testUser.comparePassword('Admin@123');
    console.log('Password test:', isMatch ? 'PASS' : 'FAIL');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUsers();
