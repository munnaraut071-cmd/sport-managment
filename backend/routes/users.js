const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Admin
router.get('/', adminOnly, async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    let query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Admin or Self
router.get('/:id', async (req, res, next) => {
  try {
    // Check if user is requesting own data or is admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Admin or Self
router.put('/:id', [
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

    // Check authorization
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only admin can update role and status
    if (req.user.role !== 'admin') {
      delete req.body.role;
      delete req.body.status;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id/risk-analysis
// @desc    Get user risk analysis
// @access  Admin
router.get('/:id/risk-analysis', adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's transaction history
    const Transaction = require('../models/Transaction');
    const transactions = await Transaction.find({ user: user._id });

    const totalTransactions = transactions.length;
    const lateTransactions = transactions.filter(t => 
      t.status === 'returned' && t.returnDate > t.dueDate
    ).length;
    const overdueTransactions = transactions.filter(t => 
      t.status === 'overdue'
    ).length;

    const riskAnalysis = {
      riskScore: user.riskScore,
      riskLevel: user.riskLevel,
      totalTransactions,
      lateTransactions,
      overdueTransactions,
      onTimeRate: totalTransactions > 0 
        ? ((totalTransactions - lateTransactions - overdueTransactions) / totalTransactions * 100).toFixed(1)
        : 100,
      recommendation: user.riskScore >= 70 
        ? 'Require deposit or restrict future issues'
        : user.riskScore >= 40 
        ? 'Send early reminders'
        : 'Normal user behavior'
    };

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        riskAnalysis
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/risky-users
// @desc    Get users with high risk scores
// @access  Admin
router.get('/alerts/risky-users', adminOnly, async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold) || 50;
    
    const users = await User.find({
      riskScore: { $gte: threshold }
    }).select('-password').sort({ riskScore: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
