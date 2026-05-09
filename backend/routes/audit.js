const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, adminOnly } = require('../middleware/auth');
const { getAuditStats, detectSuspiciousPatterns } = require('../utils/auditLogger');

// @route   GET /api/audit/logs
// @desc    Get audit logs with filtering
// @access  Admin
router.get('/logs', adminOnly, async (req, res, next) => {
  try {
    const {
      action,
      userId,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;
    
    // Build query
    const query = {};
    
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (severity) query.severity = severity;
    
    // Date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email')
        .lean(),
      AuditLog.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/audit/stats
// @desc    Get audit statistics
// @access  Admin
router.get('/stats', adminOnly, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const stats = await getAuditStats(parseInt(days));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/audit/suspicious
// @desc    Get suspicious activity patterns
// @access  Admin
router.get('/suspicious', adminOnly, async (req, res, next) => {
  try {
    const patterns = await detectSuspiciousPatterns();
    
    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/audit/user/:userId
// @desc    Get audit logs for specific user
// @access  Admin
router.get('/user/:userId', adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      AuditLog.find({ userId: req.params.userId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments({ userId: req.params.userId })
    ]);
    
    // Get activity summary
    const summary = await AuditLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.params.userId) } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: logs,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/audit/recent-alerts
// @desc    Get recent security alerts
// @access  Admin
router.get('/recent-alerts', adminOnly, async (req, res, next) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const alerts = await AuditLog.find({
      $or: [
        { action: 'ANOMALY_DETECTED' },
        { action: 'RISK_ALERT' },
        { action: 'LOGIN_FAILED', severity: 'warning' }
      ],
      timestamp: { $gte: last24Hours }
    })
    .sort({ timestamp: -1 })
    .limit(20)
    .populate('userId', 'name email')
    .lean();
    
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
