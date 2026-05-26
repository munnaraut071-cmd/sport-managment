const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Kit = require('../models/Kit');
const User = require('../models/User');
const Fine = require('../models/Fine');
const { protect, staffAndAdmin } = require('../middleware/auth');

// @route   GET /api/transactions
// @desc    Get all transactions
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, userId, kitId, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status) query.status = status;
    if (userId) query.user = userId;
    if (kitId) query.kit = kitId;

    // If not admin/staff, only show own transactions
    if (req.user.role === 'user') {
      query.user = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .populate('user', 'name email')
      .populate('kit', 'name category image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transactions
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/transactions/issue
// @desc    Issue a kit
// @access  Staff/Admin
router.post('/issue', protect, staffAndAdmin, [
  body('kitId').notEmpty().withMessage('Kit ID is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation failed in /transactions/issue:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { kitId, userId, dueDate, notes, quantity = 1 } = req.body;

    // Check if kitId is valid ObjectId to avoid CastError
    if (!mongoose.Types.ObjectId.isValid(kitId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid Kit ID format: ${kitId}`
      });
    }

    // Check kit availability
    const kit = await Kit.findById(kitId);
    if (!kit) {
      return res.status(404).json({
        success: false,
        message: 'Kit not found'
      });
    }

    if (kit.available < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${kit.available} unit(s) available`
      });
    }

    // Check user - try to find by ID first if it's a valid ObjectId
    let user = null;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }
      
      // If not found by ID and userId looks like an email
      if (!user && userId.toString().includes('@')) {
        user = await User.findOne({ email: userId });
      }

      // If still not found, try to find by name
      if (!user) {
        const escapedUserId = userId.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        user = await User.findOne({ name: { $regex: new RegExp(`^${escapedUserId}$`, 'i') } });
      }

      // If still not found, create a temporary user
      if (!user) {
        const tempEmail = userId.toString().includes('@') ? 
          userId : 
          `${userId.toString().replace(/\s+/g, '_').toLowerCase()}_${Date.now()}@temp.com`;
        
        user = await User.create({
          name: userId,
          email: tempEmail,
          password: 'TempPass123!',
          role: 'user'
        });
        console.log(`✅ Created temporary user for issuance: ${user.name} (${user.email})`);
      }
    } catch (userError) {
      console.error('❌ Error during user lookup/creation:', userError.message);
      return res.status(400).json({
        success: false,
        message: `User lookup/creation failed: ${userError.message}`
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      user: user._id,
      kit: kitId,
      type: 'issue',
      dueDate,
      notes: notes || `Issued to ${user.name}`,
      quantity
    });

    // Update kit availability
    try {
      await kit.issue(quantity);
    } catch (err) {
      console.error('❌ Error updating kit availability:', err.message);
      // Rollback transaction if kit update fails
      await Transaction.findByIdAndDelete(transaction._id);
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to update kit availability'
      });
    }

    // Update user stats
    user.totalIssues += 1;
    await user.save();

    // Populate transaction data
    await transaction.populate('user', 'name email');
    await transaction.populate('kit', 'name category image');

    // Emit socket event with safety check
    const io = req.app.get('io');
    if (io) {
      io.emit('kit_issued', {
        kitId: kit._id,
        kitName: kit.name,
        userId: user._id,
        userName: user.name,
        transactionId: transaction._id,
        quantity
      });

      // Notify user
      io.to(`user_${user._id}`).emit('notification', {
        title: 'Kit Issued',
        message: `You have been issued ${quantity} ${kit.name}(s). Due date: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'info'
      });
    }

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('❌ Error in /transactions/issue:', error.message);
    console.error('Request body:', req.body);
    // Handle cast errors specifically
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`
      });
    }
    next(error);
  }
});

// @route   POST /api/transactions/return
// @desc    Return a kit
// @access  Staff/Admin
router.post('/return', protect, staffAndAdmin, [
  body('transactionId').notEmpty().withMessage('Transaction ID is required')
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

    const { transactionId, condition, notes } = req.body;

    // Find transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Kit already returned'
      });
    }

    // Update transaction
    transaction.status = 'returned';
    transaction.returnDate = new Date();
    transaction.condition = condition || 'good';
    if (notes) transaction.notes = notes;
    await transaction.save();

    // Update kit availability
    const kit = await Kit.findById(transaction.kit);
    await kit.return();

    // Update user stats
    const user = await User.findById(transaction.user);
    user.totalReturns += 1;

    // Check if return was late
    if (transaction.daysOverdue > 0) {
      user.lateReturns += 1;
      
      // Auto-generate Fine
      const baseRate = 10; // 10 per day default
      const fineAmount = Fine.calculateFine(transaction.daysOverdue, baseRate);
      
      try {
        await Fine.create({
          user: user._id,
          transaction: transaction._id,
          kit: kit._id,
          daysLate: transaction.daysOverdue,
          finePerDay: baseRate,
          fineAmount: fineAmount,
          fineRules: {
            baseRate,
            maxCap: 30 * baseRate * 2,
            damageCharges: 0,
            processingFee: 0
          },
          notes: 'Auto-generated fine for late return',
          createdBy: req.user._id
        });
        console.log(`✅ Auto-generated fine of ₹${fineAmount} for user ${user.email}`);
      } catch (fineErr) {
        console.error('❌ Failed to auto-generate fine:', fineErr);
      }
    }

    user.updateRiskScore();
    await user.save();

    await transaction.populate('user', 'name email');
    await transaction.populate('kit', 'name category image');

    // Emit socket event
    const io = req.app.get('io');
    io.emit('kit_returned', {
      kitId: kit._id,
      kitName: kit.name,
      userId: user._id,
      userName: user.name,
      transactionId: transaction._id,
      wasLate: transaction.daysOverdue > 0,
      quantity: transaction.quantity
    });

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/transactions/my-history
// @desc    Get current user's transaction history
// @access  Private
router.get('/my-history', async (req, res, next) => {
  try {
    const transactions = await Transaction.getUserHistory(req.user._id);

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/transactions/overdue
// @desc    Get all overdue transactions
// @access  Staff/Admin
router.get('/alerts/overdue', staffAndAdmin, async (req, res, next) => {
  try {
    const transactions = await Transaction.findOverdue();

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics
// @access  Staff/Admin
router.get('/stats', staffAndAdmin, async (req, res, next) => {
  try {
    const total = await Transaction.countDocuments();
    const active = await Transaction.countDocuments({ status: { $ne: 'returned' }, dueDate: { $gte: new Date() } });
    const overdue = await Transaction.countDocuments({ status: { $ne: 'returned' }, dueDate: { $lt: new Date() } });
    const returned = await Transaction.countDocuments({ status: 'returned' });

    res.json({
      success: true,
      data: { total, active, overdue, returned }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/transactions/export
// @desc    Export transactions data
// @access  Staff/Admin
router.get('/export', staffAndAdmin, async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email rollNo')
      .populate('kit', 'name category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'name email rollNo')
      .populate('kit', 'name category image');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (req.user.role === 'user' && transaction.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this transaction' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Staff/Admin
router.put('/:id', staffAndAdmin, async (req, res, next) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const { dueDate, notes, status, condition } = req.body;
    
    if (dueDate) transaction.dueDate = dueDate;
    if (notes !== undefined) transaction.notes = notes;
    if (status) transaction.status = status;
    if (condition) transaction.condition = condition;

    await transaction.save();
    
    await transaction.populate('user', 'name email');
    await transaction.populate('kit', 'name category image');

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Admin
router.delete('/:id', staffAndAdmin, async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    await transaction.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
