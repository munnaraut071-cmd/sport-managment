const express = require('express');
const { protect, isSupervisor } = require('../middleware/auth');
const Item = require('../models/Item');
const Transaction = require('../models/Transaction');
const AIPredictor = require('../utils/AIPredictor');
const AnomalyDetector = require('../utils/AnomalyDetector');

const router = express.Router();

// All routes require auth and supervisor role
router.use(protect);
router.use(isSupervisor);

// ============ INVENTORY REPORTS ============

// Complete inventory report
router.get('/inventory/full', async (req, res) => {
  try {
    const items = await Item.find().sort({ category: 1, name: 1 });

    const report = {
      generatedAt: new Date(),
      totalItems: items.length,
      summary: {
        totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
        totalIssued: items.reduce((sum, i) => sum + i.issued, 0),
        totalAvailable: items.reduce((sum, i) => sum + (i.quantity - i.issued), 0),
        totalDamaged: items.reduce((sum, i) => sum + i.damaged, 0),
        totalLost: items.reduce((sum, i) => sum + i.lost, 0),
        totalValue: items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0)
      },
      byCategory: {},
      items: items.map(i => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        issued: i.issued,
        available: i.quantity - i.issued,
        damaged: i.damaged,
        lost: i.lost,
        value: i.quantity * i.unitPrice,
        reorderLevel: i.reorderLevel,
        needsReorder: i.needsReorder()
      }))
    };

    // Category breakdown
    items.forEach(item => {
      if (!report.byCategory[item.category]) {
        report.byCategory[item.category] = {
          count: 0,
          quantity: 0,
          value: 0
        };
      }
      report.byCategory[item.category].count++;
      report.byCategory[item.category].quantity += item.quantity;
      report.byCategory[item.category].value += item.quantity * item.unitPrice;
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Low stock report
router.get('/inventory/low-stock', async (req, res) => {
  try {
    const items = await Item.find();
    const lowStockItems = items
      .filter(item => item.needsReorder())
      .map(item => ({
        name: item.name,
        category: item.category,
        currentStock: item.quantity - item.issued,
        reorderLevel: item.reorderLevel,
        urgency: AnomalyDetector.getUrgencyLevel(item),
        recommendedReorder: Math.round((item.baseDemand || 10) * 3),
        supplier: item.supplier
      }))
      .sort((a, b) => a.currentStock - b.currentStock);

    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      generatedAt: new Date(),
      data: lowStockItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Damage & loss report
router.get('/inventory/damage-loss', async (req, res) => {
  try {
    const items = await Item.find();
    
    const report = {
      generatedAt: new Date(),
      summary: {
        totalDamaged: items.reduce((sum, i) => sum + i.damaged, 0),
        totalLost: items.reduce((sum, i) => sum + i.lost, 0),
        damageRate: items.length > 0 
          ? ((items.reduce((sum, i) => sum + i.damaged, 0) / items.reduce((sum, i) => sum + i.quantity, 0)) * 100).toFixed(2) + '%'
          : '0%',
        lossRate: items.length > 0
          ? ((items.reduce((sum, i) => sum + i.lost, 0) / items.reduce((sum, i) => sum + i.quantity, 0)) * 100).toFixed(2) + '%'
          : '0%'
      },
      highDamageItems: items
        .filter(i => i.damaged > 0)
        .sort((a, b) => b.damaged - a.damaged)
        .slice(0, 10)
        .map(i => ({
          name: i.name,
          category: i.category,
          damaged: i.damaged,
          damageRate: ((i.damaged / i.quantity) * 100).toFixed(2) + '%'
        })),
      highLossItems: items
        .filter(i => i.lost > 0)
        .sort((a, b) => b.lost - a.lost)
        .slice(0, 10)
        .map(i => ({
          name: i.name,
          category: i.category,
          lost: i.lost,
          lossRate: ((i.lost / i.quantity) * 100).toFixed(2) + '%'
        }))
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ TRANSACTION REPORTS ============

// Transaction summary report
router.get('/transactions/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await Transaction.find(query);

    const report = {
      generatedAt: new Date(),
      period: { startDate, endDate },
      totalTransactions: transactions.length,
      byType: {
        issued: transactions.filter(t => t.type === 'issue').length,
        returned: transactions.filter(t => t.type === 'return').length,
        damaged: transactions.filter(t => t.type === 'damage').length,
        lost: transactions.filter(t => t.type === 'loss').length,
        restocked: transactions.filter(t => t.type === 'restock').length
      },
      quantitySummary: {
        issued: transactions.filter(t => t.type === 'issue').reduce((sum, t) => sum + t.quantity, 0),
        returned: transactions.filter(t => t.type === 'return').reduce((sum, t) => sum + t.quantity, 0),
        damaged: transactions.filter(t => t.type === 'damage').reduce((sum, t) => sum + t.quantity, 0),
        lost: transactions.filter(t => t.type === 'loss').reduce((sum, t) => sum + t.quantity, 0)
      }
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Top users report
router.get('/transactions/top-users', async (req, res) => {
  try {
    const topUsers = await Transaction.aggregate([
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          transactionCount: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { transactionCount: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      generatedAt: new Date(),
      count: topUsers.length,
      data: topUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ AI & ANALYTICS REPORTS ============

// AI predictions report
router.get('/ai/predictions', async (req, res) => {
  try {
    const predictions = await AIPredictor.predictAllDemands();
    const futureDemand = await AIPredictor.predictFutureDemand(6);
    const trending = await AIPredictor.getTrendingItems(10);
    const recommendations = await AIPredictor.getReorderRecommendations();

    const report = {
      generatedAt: new Date(),
      currentPredictions: predictions.slice(0, 20),
      topTrendingItems: trending,
      reorderRecommendations: recommendations.slice(0, 10),
      sixMonthForecast: futureDemand
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Anomalies report
router.get('/anomalies/report', async (req, res) => {
  try {
    const report = await AnomalyDetector.detectAllAnomalies('low');
    const stats = await AnomalyDetector.getAnomalyStatistics();

    const fullReport = {
      generatedAt: new Date(),
      summary: report.summary,
      statistics: stats.data,
      topAnomalies: report.data.slice(0, 15)
    };

    res.status(200).json({
      success: true,
      data: fullReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ EXPORT REPORTS ============

// Export inventory as JSON
router.get('/export/inventory', async (req, res) => {
  try {
    const items = await Item.find().lean();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-' + new Date().toISOString().split('T')[0] + '.json');
    res.json({
      exportedAt: new Date(),
      totalItems: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Export transactions as JSON
router.get('/export/transactions', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await Transaction.find(query).lean();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions-' + new Date().toISOString().split('T')[0] + '.json');
    res.json({
      exportedAt: new Date(),
      period: { startDate, endDate },
      totalRecords: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Master report (everything)
router.get('/export/master-report', async (req, res) => {
  try {
    const masterReport = {
      exportedAt: new Date(),
      inventory: {
        items: await Item.find().lean(),
        summary: {
          total: await Item.countDocuments(),
          active: await Item.countDocuments({ active: true })
        }
      },
      transactions: {
        total: await Transaction.countDocuments(),
        recent: await Transaction.find().sort({ timestamp: -1 }).limit(100).lean()
      },
      analytics: {
        predictions: await AIPredictor.predictAllDemands(),
        trending: await AIPredictor.getTrendingItems(10),
        reorderItems: await AIPredictor.getReorderRecommendations()
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=master-report-' + new Date().toISOString().split('T')[0] + '.json');
    res.json(masterReport);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
