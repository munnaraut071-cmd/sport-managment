const express = require('express');
const { protect, isSupervisor } = require('../middleware/auth');
const AnomalyDetector = require('../utils/AnomalyDetector');

const router = express.Router();

// All routes require auth and supervisor role
router.use(protect);
router.use(isSupervisor);

// ============ ANOMALY DETECTION ENDPOINTS ============

/**
 * Detect anomalies for a single item
 * GET /api/anomalies/item/:id
 */
router.get('/item/:id', async (req, res) => {
  try {
    const report = await AnomalyDetector.detectAnomalies(req.params.id);
    
    if (!report.success) {
      return res.status(404).json({
        success: false,
        message: report.message
      });
    }

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

/**
 * Detect all anomalies in inventory
 * GET /api/anomalies/detect-all?threshold=medium
 * 
 * Query params:
 * - threshold: critical | high | medium | low (default: medium)
 */
router.get('/detect-all', async (req, res) => {
  try {
    const threshold = req.query.threshold || 'medium';
    const validThresholds = ['critical', 'high', 'medium', 'low'];

    if (!validThresholds.includes(threshold)) {
      return res.status(400).json({
        success: false,
        message: `Invalid threshold. Must be one of: ${validThresholds.join(', ')}`
      });
    }

    const report = await AnomalyDetector.detectAllAnomalies(threshold);

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

/**
 * Get anomaly statistics
 * GET /api/anomalies/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await AnomalyDetector.getAnomalyStatistics();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get critical anomalies only
 * GET /api/anomalies/critical
 */
router.get('/critical', async (req, res) => {
  try {
    const report = await AnomalyDetector.detectAllAnomalies('critical');
    
    // Filter only critical items
    const criticalItems = report.data.filter(item => item.anomalyLevel === 'CRITICAL');

    res.status(200).json({
      success: true,
      criticalCount: criticalItems.length,
      data: criticalItems,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get anomaly by type
 * GET /api/anomalies/by-type?type=high_damage_rate
 */
router.get('/by-type', async (req, res) => {
  try {
    const anomalyType = req.query.type;

    if (!anomalyType) {
      return res.status(400).json({
        success: false,
        message: 'Anomaly type parameter required'
      });
    }

    const report = await AnomalyDetector.detectAllAnomalies('low');
    
    // Filter by type
    const filtered = report.data.map(item => ({
      ...item,
      anomalies: item.topAnomalies.filter(a => a.type === anomalyType)
    })).filter(item => item.anomalies.length > 0);

    res.status(200).json({
      success: true,
      anomalyType,
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get anomalies by severity
 * GET /api/anomalies/by-severity?severity=high
 */
router.get('/by-severity', async (req, res) => {
  try {
    const severity = req.query.severity || 'high';
    const validSeverities = ['critical', 'high', 'medium', 'low'];

    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
      });
    }

    const report = await AnomalyDetector.detectAllAnomalies(severity);

    res.status(200).json({
      success: true,
      severity,
      count: report.anomalousItems,
      data: report.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get anomalies by category
 * GET /api/anomalies/by-category?category=Cricket
 */
router.get('/by-category', async (req, res) => {
  try {
    const category = req.query.category;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter required'
      });
    }

    const report = await AnomalyDetector.detectAllAnomalies('low');
    
    // Filter by category
    const filtered = report.data.filter(item => item.category === category);

    res.status(200).json({
      success: true,
      category,
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get anomaly report (detailed analysis)
 * GET /api/anomalies/report
 */
router.get('/report', async (req, res) => {
  try {
    const fullReport = await AnomalyDetector.detectAllAnomalies('low');
    const stats = await AnomalyDetector.getAnomalyStatistics();

    const report = {
      generatedAt: new Date(),
      summary: {
        ...fullReport.summary,
        ...stats.data
      },
      details: {
        totalItemsAnalyzed: fullReport.totalItemsAnalyzed,
        anomalousItems: fullReport.anomalousItems,
        threshold: fullReport.threshold,
        items: fullReport.data.slice(0, 20) // Top 20
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

module.exports = router;
