// Backend Diagnostic Script
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Backend Diagnostic Report');
console.log('━'.repeat(50));

// 1. Check Environment
console.log('\n✓ Environment Variables:');
console.log(`  PORT: ${process.env.PORT || 5000}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  MONGODB_URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-kit-management'}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? '*** SET ***' : '*** NOT SET ***'}`);

// 2. Check MongoDB Connection
async function testMongoDB() {
  console.log('\n✓ Testing MongoDB Connection:');
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-kit-management';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('  ✅ Connected Successfully');
    console.log(`  Database: ${mongoose.connection.db.getName()}`);
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`  Collections: ${collections.length}`);
    collections.forEach(c => console.log(`    - ${c.name}`));
    
    await mongoose.disconnect();
  } catch (error) {
    console.log(`  ❌ Connection Failed: ${error.message}`);
    console.log(`     Make sure MongoDB is running at: ${process.env.MONGODB_URI || 'mongodb://localhost:27017'}`);
  }
}

// 3. Check Port Availability
const net = require('net');
async function checkPort(port = 5000) {
  console.log(`\n✓ Checking Port ${port}:`);
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`  ❌ Port ${port} is already in use`);
      } else {
        console.log(`  ❌ Error: ${err.message}`);
      }
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      console.log(`  ✅ Port ${port} is available`);
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

// 4. Check Required Packages
function checkPackages() {
  console.log('\n✓ Checking Dependencies:');
  const required = ['express', 'mongoose', 'cors', 'dotenv', 'bcryptjs', 'jsonwebtoken', 'express-validator', 'multer'];
  
  required.forEach(pkg => {
    try {
      require(pkg);
      console.log(`  ✅ ${pkg}`);
    } catch (e) {
      console.log(`  ❌ ${pkg} - NOT INSTALLED`);
    }
  });
}

// Run diagnostics
async function runDiagnostics() {
  checkPackages();
  const portAvailable = await checkPort();
  await testMongoDB();
  
  console.log('\n' + '━'.repeat(50));
  console.log('✓ Diagnostic Complete');
  console.log('\n📝 Next Steps:');
  
  if (!portAvailable) {
    console.log('  1. Stop the process using port 5000');
    console.log('     Command: netstat -ano | findstr :5000');
  }
  
  console.log('  2. Ensure MongoDB is running');
  console.log('     Start MongoDB or update MONGODB_URI in .env');
  
  console.log('  3. Start the backend: npm run dev');
  console.log('\n');
  process.exit(0);
}

runDiagnostics();
