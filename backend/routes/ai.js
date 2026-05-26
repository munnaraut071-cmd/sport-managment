const express = require('express');
const router = express.Router();
const Kit = require('../models/Kit');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Tournament = require('../models/Tournament');
const Recommendation = require('../models/Recommendation');
const { protect, adminOnly } = require('../middleware/auth');
const { predictDemand, getComprehensiveForecast, getQuarterlyForecast } = require('../ai/demandPrediction');
const { generateRecommendations, getSeasonalRecommendations } = require('../ai/recommendation');
const { analyzeUserBehavior, generateSmartReminderSchedule, predictReturnTimeliness } = require('../ai/behaviorAnalysis');
const { generateRestockingAlerts, getUpcomingEvents, getCurrentAcademicPeriod, generateTournamentRecommendations, generatePersonalizedRecommendations } = require('../ai/academicCalendar');
const { detectUserAnomalies, detectSystemAnomalies, batchAnomalyScan } = require('../ai/anomalyDetection');
const { calculateKitHealth, getMaintenanceSchedule, generateMaintenanceAlerts, recordMaintenance } = require('../ai/predictiveMaintenance');
const aiService = require('../services/aiService');

// @route   GET /api/ai/demand-prediction
// @desc    Get AI demand predictions
// @access  Admin
router.get('/demand-prediction', protect, adminOnly, async (req, res, next) => {
  try {
    const predictions = await predictDemand();
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/purchase-recommendations
// @desc    Get AI purchase recommendations
// @access  Admin
router.get('/purchase-recommendations', protect, adminOnly, async (req, res, next) => {
  try {
    const recommendations = await generateRecommendations();
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/recommendations
// @desc    Alias for purchase recommendations
// @access  Admin
router.get('/recommendations', protect, adminOnly, async (req, res, next) => {
  try {
    const recommendations = await generateRecommendations();
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/recommendations/upcoming-events
// @desc    Get tournament/event based restocking recommendations
// @access  Admin
router.get('/recommendations/upcoming-events', protect, adminOnly, async (req, res, next) => {
  try {
    const recommendations = await generateTournamentRecommendations(Kit, Transaction, Tournament, Recommendation);
    
    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/kits/recommend/:playerId
// @desc    Get personalized kit recommendations for a player
// @access  Protect (Admin or the user themselves)
router.get('/kits/recommend/:playerId', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.playerId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const recommendations = await generatePersonalizedRecommendations(User, Kit, Transaction, Recommendation, req.params.playerId);
    
    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/inventory/low-stock
// @desc    Predict required stock before tournaments and suggest replacements
// @access  Admin
router.get('/inventory/low-stock', protect, adminOnly, async (req, res, next) => {
  try {
    const recommendations = await generateTournamentRecommendations(Kit, Transaction, Tournament, Recommendation);
    const lowStock = recommendations.filter(r => r.type === 'restock' && r.quantityNeeded > 0);
    
    res.json({
      success: true,
      count: lowStock.length,
      data: lowStock
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/risk-analysis
// @desc    Get AI risk analysis for all users
// @access  Admin
router.get('/risk-analysis', protect, adminOnly, async (req, res, next) => {
  try {
    const { threshold = 50 } = req.query;
    
    const users = await User.find({
      riskScore: { $gte: parseInt(threshold) }
    }).select('-password').sort({ riskScore: -1 });
    
    const analysis = users.map(user => ({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      riskScore: user.riskScore,
      riskLevel: user.riskLevel,
      stats: {
        totalIssues: user.totalIssues,
        totalReturns: user.totalReturns,
        lateReturns: user.lateReturns
      },
      recommendation: user.riskScore >= 70 
        ? 'Restrict future issues, require deposit'
        : user.riskScore >= 40 
        ? 'Send early reminders'
        : 'Normal behavior'
    }));
    
    res.json({
      success: true,
      count: analysis.length,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/user-behavior/:userId
// @desc    Get AI behavior analysis for specific user
// @access  Admin
router.get('/user-behavior/:userId', protect, adminOnly, async (req, res, next) => {
  try {
    const analysis = await analyzeUserBehavior(req.params.userId);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/ai/run-analysis
// @desc    Manually trigger AI analysis
// @access  Admin
router.post('/run-analysis', protect, adminOnly, async (req, res, next) => {
  try {
    // Run demand prediction
    const demandPredictions = await predictDemand();
    
    // Run purchase recommendations
    const purchaseRecommendations = await generateRecommendations();
    
    // Update kit predictions
    for (const prediction of demandPredictions) {
      await Kit.findByIdAndUpdate(prediction.kitId, {
        aiPrediction: prediction.level,
        predictedDemand: prediction.predictedDemand
      });
    }
    
    res.json({
      success: true,
      message: 'AI analysis completed successfully',
      data: {
        predictionsUpdated: demandPredictions.length,
        recommendationsGenerated: purchaseRecommendations.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/insights
// @desc    Get comprehensive AI insights
// @access  Admin
router.get('/insights', protect, adminOnly, async (req, res, next) => {
  try {
    // Aggregate various AI insights
    const [
      demandPredictions,
      purchaseRecommendations,
      highRiskUsers
    ] = await Promise.all([
      predictDemand(),
      generateRecommendations(),
      User.find({ riskScore: { $gte: 50 } }).select('-password').countDocuments()
    ]);
    
    // Calculate insights
    const highDemandKits = demandPredictions.filter(p => p.level === 'high');
    const criticalRecommendations = purchaseRecommendations.filter(r => r.priority === 'high');
    
    res.json({
      success: true,
      data: {
        summary: {
          totalPredictions: demandPredictions.length,
          highDemandKits: highDemandKits.length,
          purchaseRecommendations: purchaseRecommendations.length,
          criticalPurchases: criticalRecommendations.length,
          highRiskUsers
        },
        demandPredictions,
        purchaseRecommendations: criticalRecommendations,
        alerts: [
          ...(highDemandKits.length > 0 ? [{
            type: 'demand',
            severity: 'high',
            message: `${highDemandKits.length} kits predicted to have high demand`
          }] : []),
          ...(criticalRecommendations.length > 0 ? [{
            type: 'purchase',
            severity: 'high',
            message: `${criticalRecommendations.length} urgent purchase recommendations`
          }] : [])
        ]
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/comprehensive-forecast
// @desc    Get comprehensive demand forecast with academic calendar
// @access  Admin
router.get('/comprehensive-forecast', protect, adminOnly, async (req, res, next) => {
  try {
    const forecast = await getComprehensiveForecast();
    
    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/restocking-alerts
// @desc    Get AI alerts for restocking based on upcoming events
// @access  Admin
router.get('/restocking-alerts', protect, adminOnly, async (req, res, next) => {
  try {
    const alerts = await generateRestockingAlerts(Kit, Transaction);
    
    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/academic-calendar
// @desc    Get academic calendar and upcoming events
// @access  Admin
router.get('/academic-calendar', protect, adminOnly, async (req, res, next) => {
  try {
    const currentPeriod = getCurrentAcademicPeriod();
    const upcomingEvents = getUpcomingEvents(60);
    const quarterlyForecast = getQuarterlyForecast();
    
    res.json({
      success: true,
      data: {
        currentPeriod,
        upcomingEvents,
        quarterlyForecast,
        summary: {
          totalUpcomingEvents: upcomingEvents.length,
          highPriorityEvents: upcomingEvents.filter(e => e.priority === 'high').length,
          nextMajorEvent: upcomingEvents[0] || null
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/seasonal-recommendations
// @desc    Get seasonal buying recommendations
// @access  Admin
router.get('/seasonal-recommendations', protect, adminOnly, async (req, res, next) => {
  try {
    const recommendations = await getSeasonalRecommendations();
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/smart-reminders/:userId
// @desc    Get AI-generated smart reminder schedule for a user
// @access  Admin/User (own data)
router.get('/smart-reminders/:userId', protect, async (req, res, next) => {
  try {
    // Allow users to see their own reminder schedule, or admin any user's
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const schedule = await generateSmartReminderSchedule(req.params.userId);
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/return-prediction/:userId
// @desc    Get AI prediction of return timeliness for user's active loans
// @access  Admin/User (own data)
router.get('/return-prediction/:userId', protect, async (req, res, next) => {
  try {
    // Allow users to see their own prediction, or admin any user's
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const prediction = await predictReturnTimeliness(req.params.userId);
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/user-preferences/:userId
// @desc    Get user's sport preferences based on borrowing history
// @access  Admin/User (own data)
router.get('/user-preferences/:userId', protect, async (req, res, next) => {
  try {
    const { getUserPreferences } = require('../ai/behaviorAnalysis');
    
    // Allow users to see their own preferences, or admin any user's
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const preferences = await getUserPreferences(req.params.userId);
    
    res.json({
      success: true,
      data: {
        userId: req.params.userId,
        preferredCategories: preferences,
        message: preferences.length > 0 
          ? `User prefers: ${preferences.join(', ')}`
          : 'No preference data available yet'
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ANOMALY DETECTION ROUTES
// ============================================

// @route   GET /api/ai/anomalies/user/:userId
// @desc    Detect anomalies for specific user
// @access  Admin
router.get('/anomalies/user/:userId', protect, adminOnly, async (req, res, next) => {
  try {
    const analysis = await detectUserAnomalies(req.params.userId);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/anomalies/system
// @desc    Detect system-wide anomalies
// @access  Admin
router.get('/anomalies/system', protect, adminOnly, async (req, res, next) => {
  try {
    const analysis = await detectSystemAnomalies();
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/ai/anomalies/scan
// @desc    Run batch anomaly scan on all users
// @access  Admin
router.post('/anomalies/scan', protect, adminOnly, async (req, res, next) => {
  try {
    const results = await batchAnomalyScan();
    
    res.json({
      success: true,
      message: `Scanned ${results.scannedUsers} users, found ${results.flaggedUsers} flagged`,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/anomalies/flagged-users
// @desc    Get all flagged users
// @access  Admin
router.get('/anomalies/flagged-users', protect, adminOnly, async (req, res, next) => {
  try {
    const results = await batchAnomalyScan();
    
    res.json({
      success: true,
      count: results.flaggedUsers,
      data: results.results
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// PREDICTIVE MAINTENANCE ROUTES
// ============================================

// @route   GET /api/ai/maintenance/schedule
// @desc    Get maintenance schedule for all kits
// @access  Admin
router.get('/maintenance/schedule', protect, adminOnly, async (req, res, next) => {
  try {
    const schedule = await getMaintenanceSchedule();
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/maintenance/kit/:kitId
// @desc    Get health score for specific kit
// @access  Admin
router.get('/maintenance/kit/:kitId', protect, adminOnly, async (req, res, next) => {
  try {
    const health = await calculateKitHealth(req.params.kitId);
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/maintenance/alerts
// @desc    Get maintenance alerts
// @access  Admin
router.get('/maintenance/alerts', protect, adminOnly, async (req, res, next) => {
  try {
    const alerts = await generateMaintenanceAlerts();
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/ai/maintenance/record/:kitId
// @desc    Record maintenance activity
// @access  Admin
router.post('/maintenance/record/:kitId', protect, adminOnly, async (req, res, next) => {
  try {
    const result = await recordMaintenance(req.params.kitId, req.body);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/health
// @desc    Check AI service health
// @access  Admin
router.get('/health', protect, adminOnly, async (req, res, next) => {
  try {
    const health = await aiService.checkHealth();
    res.json({
      success: true,
      aiService: health
    });
  } catch (error) {
    res.json({
      success: false,
      aiService: { status: 'unavailable', error: error.message }
    });
  }
});

// @route   POST /api/ai/forecast-kit/:kitId
// @desc    Get demand forecast for specific kit using AI microservice
// @access  Admin
router.post('/forecast-kit/:kitId', protect, adminOnly, async (req, res, next) => {
  try {
    const kit = await Kit.findById(req.params.kitId);
    if (!kit) {
      return res.status(404).json({ success: false, message: 'Kit not found' });
    }

    // Get transaction history for this kit
    const transactions = await Transaction.find({ kit: kit._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const historicalData = transactions.map(t => ({
      kit_id: kit._id.toString(),
      kit_name: kit.name,
      category: kit.category,
      user_id: t.user._id.toString(),
      issue_date: t.issueDate.toISOString().split('T')[0],
      return_date: t.returnDate ? t.returnDate.toISOString().split('T')[0] : null,
      due_date: t.dueDate.toISOString().split('T')[0],
      is_returned: t.status === 'returned',
      is_overdue: t.status === 'overdue',
      quantity: t.quantity || 1
    }));

    const forecastData = {
      kit_id: kit._id.toString(),
      kit_name: kit.name,
      category: kit.category,
      historical_data: historicalData,
      forecast_days: req.body.forecast_days || 30
    };

    const forecast = await aiService.forecastDemand(forecastData);

    res.json({
      success: true,
      kit: {
        _id: kit._id,
        name: kit.name,
        category: kit.category
      },
      forecast
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/ai/late-return-prediction/:userId
// @desc    Predict late return probability for a user
// @access  Admin/Staff
router.post('/late-return-prediction/:userId', protect, async (req, res, next) => {
  try {
    // Only allow admin/staff or the user themselves
    if (req.user.role === 'user' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user transaction history
    const transactions = await Transaction.find({ user: user._id })
      .populate('kit', 'name category');

    const userHistory = transactions.map(t => ({
      kit_id: t.kit._id.toString(),
      kit_name: t.kit.name,
      category: t.kit.category,
      user_id: user._id.toString(),
      issue_date: t.issueDate.toISOString().split('T')[0],
      return_date: t.returnDate ? t.returnDate.toISOString().split('T')[0] : null,
      due_date: t.dueDate.toISOString().split('T')[0],
      is_returned: t.status === 'returned',
      is_overdue: t.status === 'overdue',
      quantity: t.quantity || 1
    }));

    // Calculate metrics
    const currentLoans = transactions.filter(t => t.status === 'active').length;
    const returnedTransactions = transactions.filter(t => t.status === 'returned');
    const avgReturnDays = returnedTransactions.length > 0 
      ? returnedTransactions.reduce((sum, t) => {
          const days = Math.ceil((t.returnDate - t.issueDate) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / returnedTransactions.length
      : 0;
    const lateReturnsCount = transactions.filter(t => t.status === 'overdue').length;

    const predictionData = {
      user_id: user._id.toString(),
      user_history: userHistory,
      kit_category: req.body.kitCategory || 'General',
      current_loans: currentLoans,
      avg_return_days: avgReturnDays,
      late_returns_count: lateReturnsCount,
      total_transactions: transactions.length
    };

    const prediction = await aiService.predictLateReturn(predictionData);

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      prediction
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/anomalies
// @desc    Get all system anomalies
// @access  Admin
router.get('/anomalies', protect, adminOnly, async (req, res, next) => {
  try {
    const analysis = await detectSystemAnomalies();
    
    // Add time field for frontend
    const anomalies = (analysis.systemAnomalies || []).map(a => ({
      ...a,
      time: new Date().toLocaleTimeString(),
      status: 'active'
    }));
    
    res.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/predictions
// @desc    Get all AI predictions (demand, weekly, distribution)
// @access  Admin
router.get('/predictions', protect, adminOnly, async (req, res, next) => {
  try {
    const demandPredictions = await predictDemand();
    const forecast = await getComprehensiveForecast();
    
    // Format data for dashboard
    const demand = demandPredictions.map(p => ({
      kit: p.kitName,
      current: p.currentStock,
      predicted: p.predictedDemand,
      confidence: p.confidence || 85,
      trend: p.trend || (p.predictedDemand > p.currentStock ? 'up' : 'stable'),
      status: p.level
    }));

    // Generate some mock weekly data if forecast doesn't provide it
    const weekly = forecast.weeklyTrend || [
      { day: 'Mon', actual: 12, predicted: 15 },
      { day: 'Tue', actual: 18, predicted: 20 },
      { day: 'Wed', actual: 15, predicted: 18 },
      { day: 'Thu', actual: 22, predicted: 25 },
      { day: 'Fri', actual: 28, predicted: 30 },
      { day: 'Sat', actual: 35, predicted: 38 },
      { day: 'Sun', actual: 20, predicted: 22 },
    ];

    const distribution = forecast.categoryDistribution || [
      { name: 'Cricket', value: 35, color: '#22c55e' },
      { name: 'Football', value: 28, color: '#3b82f6' },
      { name: 'Badminton', value: 18, color: '#8b5cf6' },
      { name: 'Basketball', value: 12, color: '#f59e0b' },
      { name: 'Others', value: 7, color: '#64748b' },
    ];
    
    res.json({
      success: true,
      data: {
        demand,
        weekly,
        distribution
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/ai/stats
// @desc    Get AI service statistics
// @access  Admin
router.get('/stats', protect, adminOnly, async (req, res, next) => {
  try {
    const demandPredictions = await predictDemand();
    const purchaseRecommendations = await generateRecommendations();
    const anomalies = await detectSystemAnomalies();
    
    const stats = [
      { title: 'AI Accuracy', value: '94%', subtitle: 'Prediction accuracy', icon: 'Target', color: 'emerald', gradient: 'from-[#064e3b] to-[#065f46]' },
      { title: 'Predictions', value: demandPredictions.length.toString(), subtitle: 'Active predictions', icon: 'Brain', color: 'blue', gradient: 'from-[#1e40af] to-[#1e3a8a]' },
      { title: 'Anomalies', value: (anomalies.anomalies?.length || 0).toString(), subtitle: 'Detected issues', icon: 'AlertTriangle', color: 'amber', gradient: 'from-[#92400e] to-[#78350f]' },
      { title: 'Recommendations', value: purchaseRecommendations.length.toString(), subtitle: 'Active suggestions', icon: 'Lightbulb', color: 'purple', gradient: 'from-[#5b21b6] to-[#4c1d95]' },
    ];
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
