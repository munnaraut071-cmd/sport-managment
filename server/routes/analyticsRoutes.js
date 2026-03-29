const express = require('express');
const { protect, isSupervisor } = require('../middleware/auth');
const AIPredictor = require('../utils/AIPredictor');

const router = express.Router();

// All analytics routes require authentication and supervisor role
router.use(protect);
router.use(isSupervisor);

// ============ DASHBOARD ANALYTICS ============

router.get('/dashboard', async (req, res) => {
  try {
    const [
      inventoryAnalytics,
      reorderRecommendations,
      trendingItems,
      demandPredictions,
      smartReminders
    ] = await Promise.all([
      AIPredictor.getInventoryAnalytics(),
      AIPredictor.getReorderRecommendations(),
      AIPredictor.getTrendingItems(5),
      AIPredictor.predictAllDemands(),
      AIPredictor.getSmartReminders()
    ]);

    res.status(200).json({
      success: true,
      data: {
        inventoryAnalytics,
        reorderRecommendations,
        trendingItems,
        demandPredictions,
        smartReminders,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ INVENTORY ANALYTICS ============

router.get('/inventory', async (req, res) => {
  try {
    const analytics = await AIPredictor.getInventoryAnalytics();
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ DEMAND PREDICTIONS ============

router.get('/demand/current', async (req, res) => {
  try {
    const predictions = await AIPredictor.predictAllDemands();
    
    res.status(200).json({
      success: true,
      count: predictions.length,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/demand/future', async (req, res) => {
  try {
    const months = req.query.months || 3;
    const futureDemand = await AIPredictor.predictFutureDemand(parseInt(months));
    
    res.status(200).json({
      success: true,
      data: futureDemand
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ TRENDING ITEMS ============

router.get('/trending', async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const trendingItems = await AIPredictor.getTrendingItems(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: trendingItems.length,
      data: trendingItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ REORDER RECOMMENDATIONS ============

router.get('/reorder/recommendations', async (req, res) => {
  try {
    const recommendations = await AIPredictor.getReorderRecommendations();
    
    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ SMART REMINDERS ============

router.get('/reminders', async (req, res) => {
  try {
    const reminders = await AIPredictor.getSmartReminders();
    
    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ ACADEMIC CALENDAR ============

router.get('/calendar', async (req, res) => {
  try {
    const calendar = {
      seasonMultipliers: AIPredictor.academicCalendar,
      categoryBaseDemand: AIPredictor.categoryBaseDemand,
      currentSeasonMultiplier: AIPredictor.getCurrentSeasonMultiplier()
    };

    res.status(200).json({
      success: true,
      data: calendar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ CATEGORY STATISTICS ============

router.get('/categories', async (req, res) => {
  try {
    const analytics = await AIPredictor.getInventoryAnalytics();
    
    res.status(200).json({
      success: true,
      data: analytics.categoryBreakdown
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ EXPORT REPORT ============

router.get('/report/export', async (req, res) => {
  try {
    const [
      inventoryAnalytics,
      reorderRecommendations,
      trendingItems,
      smartReminders,
      futureDemand
    ] = await Promise.all([
      AIPredictor.getInventoryAnalytics(),
      AIPredictor.getReorderRecommendations(),
      AIPredictor.getTrendingItems(10),
      AIPredictor.getSmartReminders(),
      AIPredictor.predictFutureDemand(6)
    ]);

    const report = {
      generatedAt: new Date(),
      period: 'Current',
      summary: inventoryAnalytics,
      reorderPriorities: reorderRecommendations,
      trendingItems,
      actionItems: smartReminders,
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

module.exports = router;
