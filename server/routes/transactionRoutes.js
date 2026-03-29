const express = require('express');
const { protect, isSupervisor } = require('../middleware/auth');
const Transaction = require('../models/Transaction');

const router = express.Router();

router.use(protect);

// ============ GET TRANSACTIONS ============

// Get all transactions with filters
router.get('/', async (req, res) => {
  try {
    const { type, itemId, userId, startDate, endDate, limit = 50, skip = 0 } = req.query;
    let query = {};

    if (type) query.type = type;
    if (itemId) query.itemId = itemId;
    if (userId) query.userId = userId;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const transactions = await Transaction
      .find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('itemId', 'name category');

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      pagination: {
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: (parseInt(skip) + parseInt(limit)) < total
      },
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('itemId', 'name category');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's transaction history
router.get('/user/:userId', async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const transactions = await Transaction
      .find({ userId: req.params.userId })
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('itemId', 'name category');

    const total = await Transaction.countDocuments({ userId: req.params.userId });

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get item's transaction history
router.get('/item/:itemId', async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const transactions = await Transaction
      .find({ itemId: req.params.itemId })
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    const total = await Transaction.countDocuments({ itemId: req.params.itemId });

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get transaction statistics
router.get('/stats/summary', isSupervisor, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    const typeStats = {};
    stats.forEach(stat => {
      typeStats[stat._id] = {
        count: stat.count,
        quantity: stat.totalQuantity
      };
    });

    res.status(200).json({
      success: true,
      data: typeStats,
      period: { startDate, endDate }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ POST TRANSACTIONS (Create via item routes) ============

// Manually log transaction (Admin only)
router.post('/', isSupervisor, async (req, res) => {
  try {
    const { type, itemId, itemName, quantity, userId, userName, studentId, remarks, isDamaged, isLost } = req.body;

    if (!type || !itemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Type, itemId, and quantity are required'
      });
    }

    const transaction = new Transaction({
      type,
      itemId,
      itemName,
      quantity,
      userId: userId || req.user._id,
      userName: userName || req.user.name,
      studentId,
      remarks,
      isDamaged: isDamaged || false,
      isLost: isLost || false,
      status: 'completed'
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction logged successfully',
      data: transaction
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ============ AUDIT TRAIL ============

// Get audit trail for item
router.get('/audit/:itemId', isSupervisor, async (req, res) => {
  try {
    const auditTrail = await Transaction
      .find({ itemId: req.params.itemId })
      .sort({ timestamp: -1 })
      .populate('userId', 'name email role');

    if (auditTrail.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No audit trail found for this item'
      });
    }

    const summary = {
      itemId: req.params.itemId,
      totalTransactions: auditTrail.length,
      firstTransaction: auditTrail[auditTrail.length - 1].timestamp,
      lastTransaction: auditTrail[0].timestamp,
      transactionsByType: {}
    };

    auditTrail.forEach(tx => {
      if (!summary.transactionsByType[tx.type]) {
        summary.transactionsByType[tx.type] = 0;
      }
      summary.transactionsByType[tx.type]++;
    });

    res.status(200).json({
      success: true,
      summary,
      trail: auditTrail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
