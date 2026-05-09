const mongoose = require('mongoose');
const User = require('./models/User');
const Kit = require('./models/Kit');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sportkits');
    console.log('Connected to MongoDB');

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@sportkits.com' });
    
    if (!adminExists) {
      // Create admin user
      await User.create({
        name: 'Admin User',
        email: 'admin@sportkits.com',
        password: 'Admin@123',
        role: 'admin',
        status: 'active'
      });
      console.log('✅ Admin user created: admin@sportkits.com / Admin@123');
    } else {
      console.log('⚠️ Admin user already exists');
    }

    // Check if regular user exists
    const userExists = await User.findOne({ email: 'user@sportkits.com' });
    
    if (!userExists) {
      // Create regular user
      await User.create({
        name: 'Regular User',
        email: 'user@sportkits.com',
        password: 'User@123',
        role: 'user',
        status: 'active'
      });
      console.log('✅ Regular user created: user@sportkits.com / User@123');
    } else {
      console.log('⚠️ Regular user already exists');
    }

    // Seed Cricket Kits
    const cricketKits = [
      { name: 'SG Cricket Bat', category: 'Cricket', quantity: 15, available: 12, emoji: '🏏', description: 'Professional grade English willow cricket bat' },
      { name: 'Kookaburra Ball', category: 'Cricket', quantity: 30, available: 25, emoji: '🔴', description: 'Red leather cricket ball for matches' },
      { name: 'Masuri Helmet', category: 'Cricket', quantity: 10, available: 8, emoji: '⛑️', description: 'Safety helmet with face guard' },
      { name: 'Padded Gloves', category: 'Cricket', quantity: 20, available: 18, emoji: '🧤', description: 'Batting gloves with extra padding' },
      { name: 'Cricket Pads', category: 'Cricket', quantity: 18, available: 15, emoji: '🦵', description: 'Leg guards for batting protection' },
      { name: 'Wicket Keeping Gloves', category: 'Cricket', quantity: 8, available: 6, emoji: '🧤', description: 'Specialized gloves for wicket keepers' },
      { name: 'Cricket Stumps', category: 'Cricket', quantity: 12, available: 10, emoji: '🏏', description: 'Complete wicket set with bails' },
      { name: 'Thigh Guard', category: 'Cricket', quantity: 15, available: 12, emoji: '🛡️', description: 'Protective thigh pad for batsmen' }
    ];

    for (const kitData of cricketKits) {
      const existingKit = await Kit.findOne({ name: kitData.name });
      if (!existingKit) {
        await Kit.create({
          ...kitData,
          status: 'active',
          condition: 'good'
        });
        console.log(`✅ Created kit: ${kitData.name} ${kitData.emoji}`);
      } else {
        console.log(`⚠️ Kit already exists: ${kitData.name}`);
      }
    }

    console.log('\n🎉 Seed completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedUsers();
