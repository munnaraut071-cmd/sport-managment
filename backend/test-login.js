const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find admin user
    const user = await User.findOne({ email: 'admin@sportkits.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('User found:', user.name);
    console.log('Password field exists:', !!user.password);
    console.log('Password length:', user.password ? user.password.length : 0);
    console.log('User status:', user.status);
    
    // Test password comparison
    const isMatch = await user.comparePassword('Admin@123');
    console.log('Password match result:', isMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testLogin();
