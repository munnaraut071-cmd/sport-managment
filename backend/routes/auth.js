const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { catchAsync, AppError } = require('../utils/errorHandler');
const { logAuthEvent } = require('../utils/logger');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).withMessage('Password must contain at least 8 characters, including 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
  body('role').optional().isIn(['user', 'staff', 'admin']).withMessage('Invalid role')
], catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logAuthEvent('REGISTER_FAILED', null, req.body.email, req.ip, false, { errors: errors.array() });
      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));
    }

    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      logAuthEvent('REGISTER_FAILED', null, email, req.ip, false, { reason: 'User already exists' });
      return next(new AppError('User already exists', 400, 'USER_EXISTS'));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Generate token
    const token = generateToken(user._id);

    logAuthEvent('REGISTER_SUCCESS', user._id, email, req.ip, true);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  }));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], catchAsync(async (req, res, next) => {
    console.log('🔐 Login attempt:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));
    }

    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return next(new AppError('Email and password are required', 400, 'MISSING_CREDENTIALS'));
    }

    // Check for user
    let user;
    try {
      user = await User.findOne({ email }).select('+password');
      console.log('👤 User lookup result:', user ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('❌ Database error during user lookup:', dbError);
      return next(new AppError('Database error', 500, 'DB_ERROR'));
    }
    if (!user) {
      return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    }

    // Check if user is active
    if (user.status !== 'active') {
      return next(new AppError('Account is not active', 401, 'ACCOUNT_INACTIVE'));
    }

    // Check password
    let isMatch;
    try {
      console.log('🔑 Comparing passwords...');
      isMatch = await user.comparePassword(password);
      console.log('✅ Password match result:', isMatch);
    } catch (bcryptError) {
      console.error('❌ Password comparison error:', bcryptError);
      return next(new AppError('Authentication error', 500, 'AUTH_ERROR'));
    }
    
    if (!isMatch) {
      console.log('❌ Password does not match');
      return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    }

    // Generate token
    let token;
    try {
      token = generateToken(user._id);
      console.log('🎟️ Token generated successfully');
    } catch (tokenError) {
      console.error('❌ Token generation error:', tokenError);
      return next(new AppError('Authentication error', 500, 'TOKEN_ERROR'));
    }

    console.log('✅ Login successful for:', email);
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  }));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        riskScore: user.riskScore,
        totalIssues: user.totalIssues,
        totalReturns: user.totalReturns,
        lateReturns: user.lateReturns,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, avatar } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).withMessage('New password must contain at least 8 characters, including 1 uppercase, 1 lowercase, 1 number, and 1 special character')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
