const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { detectSystemAnomalies, batchAnomalyScan } = require('../ai/anomalyDetection');
const User = require('../models/User');
const Kit = require('../models/Kit');
const Transaction = require('../models/Transaction');

// @route   GET /api/alerts/dashboard
// @desc    Get all alerts for security dashboard
// @access  Admin
router.get('/dashboard', adminOnly, async (req, res, next) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    // Run parallel queries
    const [
      systemAnomalies,
      flaggedUsers,
      highRiskUsers,
      lowStockKits,
      overdueTransactions,
      recentFailedLogins
    ] = await Promise.all([
      // System anomalies
      detectSystemAnomalies(),
      
      // Flagged users from anomaly scan
      batchAnomalyScan(),
      
      // High risk users
      User.find({ riskScore: { $gte: 50 } })
        .select('name email riskScore riskScore totalIssues lateReturns')
        .sort({ riskScore: -1 })
        .limit(10)
        .lean(),
      
      // Low stock
      Kit.findLowStock(5),
      
      // Overdue items
      Transaction.findOverdue(),
      
      // Failed logins (would need AuditLog model)
      Promise.resolve([]) // Placeholder
    ]);
    
    // Compile alerts
    const alerts = [];
    
    // Add high-risk user alerts
    highRiskUsers.forEach(user => {
      alerts.push({
        id: `risk-${user._id}`,
        type: 'risk',
        severity: user.riskScore >= 70 ? 'critical' : 'warning',
        title: `High Risk User: ${user.name}`,
        message: `Risk Score: ${user.riskScore}, Late Returns: ${user.lateReturns}`,
        targetId: user._id,
        targetType: 'user',
        timestamp: now,
        actionRequired: user.riskScore >= 70 ? 'Suspend Account' : 'Monitor Closely'
      });
    });
    
    // Add system anomaly alerts
    systemAnomalies.systemAnomalies.forEach(anomaly => {
      alerts.push({
        id: `anomaly-${anomaly.type}`,
        type: 'anomaly',
        severity: anomaly.severity,
        title: 'System Anomaly Detected',
        message: anomaly.message,
        recommendation: anomaly.recommendation,
        timestamp: now,
        actionRequired: 'Review Activity'
      });
    });
    
    // Add low stock alerts
    lowStockKits.forEach(kit => {
      const percentage = (kit.available / kit.quantity) * 100;
      alerts.push({
        id: `stock-${kit._id}`,
        type: 'stock',
        severity: percentage < 10 ? 'critical' : 'warning',
        title: `Low Stock: ${kit.name}`,
        message: `Only ${kit.available} of ${kit.quantity} remaining (${percentage.toFixed(0)}%)`,
        targetId: kit._id,
        targetType: 'kit',
        timestamp: now,
        actionRequired: 'Restock Now'
      });
    });
    
    // Add overdue alerts
    if (overdueTransactions.length > 0) {
      alerts.push({
        id: 'overdue-summary',
        type: 'overdue',
        severity: overdueTransactions.length > 10 ? 'critical' : 'warning',
        title: `${overdueTransactions.length} Overdue Items`,
        message: `${overdueTransactions.length} kits not returned on time`,
        count: overdueTransactions.length,
        timestamp: now,
        actionRequired: 'Send Reminders'
      });
    }
    
    // Sort by severity and timestamp
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    res.json({
      success: true,
      summary: {
        totalAlerts: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      },
      data: alerts
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/alerts/risk-users
// @desc    Get high-risk users with details
// @access  Admin
router.get('/risk-users', adminOnly, async (req, res, next) => {
  try {
    const { minRisk = 50, limit = 20 } = req.query;
    
    const users = await User.find({
      riskScore: { $gte: parseInt(minRisk) }
    })
    .select('-password')
    .sort({ riskScore: -1 })
    .limit(parseInt(limit))
    .lean();
    
    // Get active loans for each user
    const usersWithLoans = await Promise.all(
      users.map(async (user) => {
        const activeLoans = await Transaction.countDocuments({
          user: user._id,
          type: 'issue',
          status: 'active'
        });
        
        return {
          ...user,
          activeLoans,
          riskLevel: user.riskScore >= 70 ? 'HIGH' : user.riskScore >= 50 ? 'MEDIUM' : 'LOW'
        };
      })
    );
    
    res.json({
      success: true,
      count: usersWithLoans.length,
      data: usersWithLoans
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/alerts/dismiss/:alertId
// @desc    Dismiss an alert
// @access  Admin
router.post('/dismiss/:alertId', adminOnly, async (req, res, next) => {
  try {
    // In a real app, store dismissed alerts in a collection
    // For now, just acknowledge
    res.json({
      success: true,
      message: 'Alert dismissed',
      alertId: req.params.alertId
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
