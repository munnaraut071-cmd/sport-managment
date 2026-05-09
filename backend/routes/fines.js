const express = require('express');
const router = express.Router();
const Fine = require('../models/Fine');
const Transaction = require('../models/Transaction');
const Kit = require('../models/Kit');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { sendFineNotification } = require('../utils/notifications');

// @route   GET /api/fines
// @desc    Get all fines (Admin) or user's fines
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    let query = {};
    
    // Regular users can only see their own fines
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }
    
    const { status } = req.query;
    if (status) query.status = status;
    
    const fines = await Fine.find(query)
      .populate('user', 'name email')
      .populate('kit', 'name category')
      .populate('transaction', 'issueDate returnDate dueDate')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: fines.length,
      data: fines
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/fines/statistics
// @desc    Get fine statistics
// @access  Admin
router.get('/statistics', adminOnly, async (req, res, next) => {
  try {
    const stats = await Fine.getStatistics();
    
    // Additional stats
    const topUsers = await Fine.aggregate([
      { $match: { status: { $in: ['pending', 'disputed'] } } },
      { $group: { _id: '$user', totalFines: { $sum: '$fineAmount' } } },
      { $sort: { totalFines: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);
    
    res.json({
      success: true,
      data: {
        ...stats,
        topUsersWithFines: topUsers
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/fines/my-outstanding
// @desc    Get user's outstanding fines
// @access  Private
router.get('/my-outstanding', protect, async (req, res, next) => {
  try {
    const outstanding = await Fine.getUserOutstanding(req.user.id);
    
    res.json({
      success: true,
      data: outstanding
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/fines
// @desc    Create fine for late return
// @access  Admin
router.post('/', adminOnly, async (req, res, next) => {
  try {
    const { userId, transactionId, finePerDay, notes } = req.body;
    
    // Get transaction details
    const transaction = await Transaction.findById(transactionId)
      .populate('user', 'name email phone')
      .populate('kit', 'name value');
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    if (transaction.status !== 'returned' && transaction.status !== 'overdue') {
      return res.status(400).json({ success: false, message: 'Can only fine completed or overdue transactions' });
    }
    
    // Calculate days late
    const daysLate = transaction.daysOverdue || 0;
    
    if (daysLate <= 0) {
      return res.status(400).json({ success: false, message: 'Transaction is not late' });
    }
    
    // Check if fine already exists
    const existingFine = await Fine.findOne({ transaction: transactionId });
    if (existingFine) {
      return res.status(400).json({ success: false, message: 'Fine already exists for this transaction' });
    }
    
    // Calculate fine amount
    const baseRate = finePerDay || 10;
    const fineAmount = Fine.calculateFine(daysLate, baseRate);
    
    const fine = await Fine.create({
      user: userId || transaction.user._id,
      transaction: transactionId,
      kit: transaction.kit._id,
      daysLate,
      finePerDay: baseRate,
      fineAmount,
      fineRules: {
        baseRate,
        maxCap: 30 * baseRate * 2,
        damageCharges: 0,
        processingFee: 0
      },
      notes,
      createdBy: req.user.id
    });
    
    // Populate for notification
    await fine.populate('user', 'name email phone');
    await fine.populate('kit', 'name');
    
    // Send notification
    if (fine.user) {
      await sendFineNotification(fine.user, fine);
    }
    
    res.status(201).json({
      success: true,
      message: 'Fine created successfully',
      data: fine
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/fines/:id/pay
// @desc    Pay fine
// @access  Private (own fines) / Admin
router.post('/:id/pay', protect, async (req, res, next) => {
  try {
    const { method, transactionId } = req.body;
    
    const fine = await Fine.findById(req.params.id);
    
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && fine.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    if (fine.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Fine already paid' });
    }
    
    await fine.recordPayment({
      method: method || 'online',
      transactionId: transactionId || `PAY-${Date.now()}`,
      amount: fine.totalAmount
    });
    
    res.json({
      success: true,
      message: 'Fine paid successfully',
      data: fine
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/fines/:id/waive
// @desc    Waive fine (Admin only)
// @access  Admin
router.post('/:id/waive', adminOnly, async (req, res, next) => {
  try {
    const { reason, amount } = req.body;
    
    const fine = await Fine.findById(req.params.id);
    
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }
    
    if (fine.status !== 'pending' && fine.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Can only waive pending or disputed fines' });
    }
    
    await fine.waiveFine({
      waivedBy: req.user.id,
      reason: reason || 'Administrative decision',
      amount: amount || fine.fineAmount
    });
    
    res.json({
      success: true,
      message: 'Fine waived successfully',
      data: fine
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/fines/:id/dispute
// @desc    Raise dispute on fine
// @access  Private (own fines)
router.post('/:id/dispute', protect, async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const fine = await Fine.findById(req.params.id);
    
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }
    
    if (fine.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    if (fine.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only dispute pending fines' });
    }
    
    await fine.raiseDispute({ reason: reason || 'User dispute' });
    
    res.json({
      success: true,
      message: 'Dispute raised successfully',
      data: fine
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/fines/:id/resolve-dispute
// @desc    Resolve dispute (Admin)
// @access  Admin
router.put('/:id/resolve-dispute', adminOnly, async (req, res, next) => {
  try {
    const { resolution, status } = req.body;
    
    const fine = await Fine.findById(req.params.id);
    
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }
    
    if (fine.status !== 'disputed') {
      return res.status(400).json({ success: false, message: 'Fine is not under dispute' });
    }
    
    fine.dispute.status = status || 'resolved';
    fine.dispute.resolvedAt = new Date();
    fine.dispute.resolution = resolution;
    fine.dispute.resolvedBy = req.user.id;
    
    // If dispute resolved in user's favor, waive the fine
    if (status === 'resolved' && resolution?.includes('favor')) {
      fine.status = 'waived';
    }
    
    await fine.save();
    
    res.json({
      success: true,
      message: 'Dispute resolved',
      data: fine
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/fines/:id
// @desc    Get single fine
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const fine = await Fine.findById(req.params.id)
      .populate('user', 'name email')
      .populate('kit', 'name category')
      .populate('transaction', 'issueDate returnDate dueDate daysOverdue')
      .populate('createdBy', 'name')
      .populate('waive.waivedBy', 'name')
      .populate('dispute.resolvedBy', 'name');
    
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && fine.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    res.json({
      success: true,
      data: fine
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/fines/:id
// @desc    Delete fine (Admin only)
// @access  Admin
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const fine = await Fine.findById(req.params.id);
    
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }
    
    await fine.deleteOne();
    
    res.json({
      success: true,
      message: 'Fine deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
