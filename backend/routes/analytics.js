const express = require('express');
const router = express.Router();
const Kit = require('../models/Kit');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', protect, async (req, res, next) => {
  try {
    // Get counts - only count ACTIVE kits
    const totalKits = await Kit.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    // Get available kits count - only from ACTIVE kits
    const kits = await Kit.find({ status: 'active' });
    const availableKits = kits.reduce((sum, kit) => sum + kit.available, 0);
    const issuedKits = kits.reduce((sum, kit) => sum + Math.max(0, kit.quantity - kit.available), 0);
    
    // Get overdue transactions
    const overdueTransactions = await Transaction.findOverdue();
    
    // Get recent transactions (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recentTransactions = await Transaction.find({
      createdAt: { $gte: last7Days }
    }).countDocuments();
    
    // Get low stock items (already filters for active status)
    const lowStockKits = await Kit.findLowStock(5);
    
    res.json({
      success: true,
      data: {
        counts: {
          totalKits,
          availableKits,
          issuedKits,
          totalUsers,
          totalTransactions,
          overdueCount: overdueTransactions.length,
          recentTransactions,
          lowStockCount: lowStockKits.length
        },
        lowStockKits,
        recentOverdue: overdueTransactions.slice(0, 5)
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/usage-stats
// @desc    Get usage statistics
// @access  Admin
router.get('/usage-stats', adminOnly, async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    
    // Get transactions grouped by date
    const transactions = await Transaction.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          issues: {
            $sum: { $cond: [{ $eq: ['$type', 'issue'] }, 1, 0] }
          },
          returns: {
            $sum: { $cond: [{ $eq: ['$type', 'return'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]);
    
    // Format data
    const formattedData = transactions.map(t => ({
      date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
      issues: t.issues,
      returns: t.returns
    })).reverse();
    
    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/category-stats
// @desc    Get category statistics
// @access  Private
router.get('/category-stats', async (req, res, next) => {
  try {
    const categoryStats = await Kit.aggregate([
      {
        $group: {
          _id: '$category',
          totalKits: { $sum: '$quantity' },
          availableKits: { $sum: '$available' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const formattedStats = categoryStats.map(stat => ({
      category: stat._id,
      total: stat.totalKits,
      available: stat.availableKits,
      issued: Math.max(0, stat.totalKits - stat.availableKits),
      count: stat.count
    }));
    
    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/top-kits
// @desc    Get most issued kits
// @access  Admin
router.get('/top-kits', adminOnly, async (req, res, next) => {
  try {
    const topKits = await Transaction.aggregate([
      { $match: { type: 'issue' } },
      {
        $group: {
          _id: '$kit',
          issueCount: { $sum: 1 }
        }
      },
      { $sort: { issueCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'kits',
          localField: '_id',
          foreignField: '_id',
          as: 'kitInfo'
        }
      },
      {
        $project: {
          issueCount: 1,
          kit: { $arrayElemAt: ['$kitInfo', 0] }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: topKits
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/user-activity
// @desc    Get user activity stats
// @access  Admin
router.get('/user-activity', adminOnly, async (req, res, next) => {
  try {
    const userStats = await User.aggregate([
      {
        $project: {
          name: 1,
          email: 1,
          totalIssues: 1,
          totalReturns: 1,
          lateReturns: 1,
          riskScore: 1
        }
      },
      { $sort: { totalIssues: -1 } },
      { $limit: 20 }
    ]);
    
    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/kits-usage
// @desc    Get kits usage over time
// @access  Private
router.get('/kits-usage', async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    const days = parseInt(period) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get daily transaction statistics
    const transactionStats = await Transaction.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          issues: { 
            $sum: { $cond: [{ $eq: ['$type', 'issue'] }, 1, 0] } 
          },
          returns: { 
            $sum: { $cond: [{ $eq: ['$type', 'return'] }, 1, 0] } 
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get current totals for cumulative calculation
    const kits = await Kit.find({ status: 'active' });
    const totalQuantity = kits.reduce((sum, k) => sum + k.quantity, 0);
    const currentActive = kits.reduce((sum, k) => sum + Math.max(0, k.quantity - k.available), 0);

    // Calculate daily snapshots by working backwards or forwards
    // Here we'll just use the daily transactions to show trends
    // but we can estimate the active/available levels
    let runningActive = currentActive;
    
    // Get kit-wise statistics for comparison
    const kitStats = await Kit.find({ status: 'active' }).sort({ name: 1 });
    
    const dailyStats = kitStats.map(kit => ({
      name: kit.name,
      issued: Math.max(0, kit.quantity - kit.available),
      available: kit.available,
      active: Math.max(0, kit.quantity - kit.available),
      category: kit.category
    }));
    
    // Get category distribution
    const categoryStats = await Transaction.aggregate([
      { 
        $match: { 
          type: 'issue',
          createdAt: { $gte: startDate }
        } 
      },
      {
        $lookup: {
          from: 'kits',
          localField: 'kit',
          foreignField: '_id',
          as: 'kitInfo'
        }
      },
      { $unwind: '$kitInfo' },
      {
        $group: {
          _id: '$kitInfo.category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get popular kits
    const popularKits = await Transaction.aggregate([
      { 
        $match: { 
          type: 'issue',
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: '$kit',
          issueCount: { $sum: 1 }
        }
      },
      { $sort: { issueCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'kits',
          localField: '_id',
          foreignField: '_id',
          as: 'kitDetails'
        }
      },
      { $unwind: '$kitDetails' }
    ]);
    
    res.json({
      success: true,
      data: {
        period,
        dailyStats,
        categoryStats,
        popularKits: popularKits.map(k => ({
          name: k.kitDetails.name,
          category: k.kitDetails.category,
          issues: k.issueCount
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
