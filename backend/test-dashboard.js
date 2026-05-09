const mongoose = require('mongoose');
const Kit = require('./models/Kit');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
require('dotenv').config();

async function testDashboard() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get counts
    const totalKits = await Kit.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    // Get available kits
    const kits = await Kit.find({ status: 'active' });
    const availableKits = kits.reduce((sum, kit) => sum + kit.available, 0);
    const issuedKits = kits.reduce((sum, kit) => sum + (kit.quantity - kit.available), 0);
    
    console.log('\n=== Dashboard Stats ===');
    console.log('Total Kits:', totalKits);
    console.log('Available Kits:', availableKits);
    console.log('Issued Kits:', issuedKits);
    console.log('Total Users:', totalUsers);
    console.log('Total Transactions:', totalTransactions);
    console.log('=====================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDashboard();
