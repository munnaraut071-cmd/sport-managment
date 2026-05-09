const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/test-login', async (req, res) => {
  try {
    console.log('Login request:', req.body);
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? user.name : 'Not found');
    
    if (!user) {
      return res.json({ error: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('Token generated');
    
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.json({ error: error.message, stack: error.stack });
  }
});

app.listen(5002, () => {
  console.log('Test server on port 5002');
  mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Connected to MongoDB');
  });
});
