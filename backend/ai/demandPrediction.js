const Kit = require('../models/Kit');
const Transaction = require('../models/Transaction');
const { getAcademicMultiplier, getUpcomingEvents, getQuarterlyForecast } = require('./academicCalendar');

/**
 * AI Demand Prediction Algorithm
 * Predicts future demand for each kit based on:
 * - Historical usage patterns
 * - Current stock levels
 * - Seasonal factors
 * - Recent trends
 */

const predictDemand = async () => {
  try {
    const kits = await Kit.find({ status: 'active' });
    const predictions = [];
    
    // Get date ranges for analysis
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    for (const kit of kits) {
      // Get historical transaction data
      const recentTransactions = await Transaction.find({
        kit: kit._id,
        type: 'issue',
        createdAt: { $gte: last3Months }
      });
      
      // Calculate metrics
      const issuesLastWeek = recentTransactions.filter(t => t.createdAt >= lastWeek).length;
      const issuesLastMonth = recentTransactions.filter(t => t.createdAt >= lastMonth).length;
      const totalIssues3Months = recentTransactions.length;
      
      // Calculate weekly average
      const weeklyAverage = totalIssues3Months / 12; // 12 weeks in 3 months
      
      // Calculate trend (increasing, decreasing, stable)
      let trend = 'stable';
      if (issuesLastWeek > weeklyAverage * 1.5) {
        trend = 'increasing';
      } else if (issuesLastWeek < weeklyAverage * 0.5) {
        trend = 'decreasing';
      }
      
      // Apply seasonal multiplier
      const currentMonth = now.getMonth();
      const seasonalMultiplier = getSeasonalMultiplier(currentMonth, kit.category);
      
      // Apply academic calendar multiplier
      const academicMultiplier = getAcademicMultiplier(kit.category);
      
      // Check for upcoming tournaments/events
      const upcomingEvents = getUpcomingEvents(30);
      const relevantEvents = upcomingEvents.filter(e => 
        e.sports.includes('All') || e.sports.includes(kit.category)
      );
      
      let eventMultiplier = 1.0;
      let eventInfo = null;
      if (relevantEvents.length > 0) {
        const highPriorityEvent = relevantEvents.find(e => e.priority === 'high');
        eventMultiplier = highPriorityEvent ? 2.5 : 1.5;
        eventInfo = relevantEvents[0];
      }
      
      // Calculate predicted demand with all factors
      let predictedDemand = Math.round(weeklyAverage * 4 * seasonalMultiplier * academicMultiplier * eventMultiplier); // 4 weeks forecast
      
      // Adjust based on trend
      if (trend === 'increasing') {
        predictedDemand = Math.round(predictedDemand * 1.3);
      } else if (trend === 'decreasing') {
        predictedDemand = Math.round(predictedDemand * 0.7);
      }
      
      // Determine level
      let level = 'medium';
      const availabilityRatio = kit.available / (kit.quantity || 1);
      
      if (predictedDemand > kit.available * 2 || availabilityRatio < 0.2) {
        level = 'high';
      } else if (predictedDemand < kit.available * 0.5 && availabilityRatio > 0.5) {
        level = 'low';
      }
      
      // Calculate confidence score (0-100)
      const confidence = Math.min(95, 70 + (recentTransactions.length > 10 ? 15 : 0));
      
      predictions.push({
        kitId: kit._id,
        kitName: kit.name,
        category: kit.category,
        currentStock: kit.available,
        totalStock: kit.quantity,
        predictedDemand,
        weeklyAverage: Math.round(weeklyAverage * 10) / 10,
        trend,
        level,
        confidence,
        seasonalMultiplier,
        factors: {
          recentActivity: issuesLastWeek,
          monthlyActivity: issuesLastMonth,
          seasonalFactor: true,
          academicFactor: academicMultiplier !== 1.0,
          eventFactor: eventMultiplier !== 1.0,
          upcomingEvent: eventInfo ? {
            name: eventInfo.name,
            daysUntil: eventInfo.daysUntil,
            priority: eventInfo.priority
          } : null,
          stockLevel: availabilityRatio < 0.3 ? 'low' : availabilityRatio < 0.6 ? 'medium' : 'high'
        },
        multipliers: {
          seasonal: seasonalMultiplier,
          academic: academicMultiplier,
          event: eventMultiplier,
          combined: seasonalMultiplier * academicMultiplier * eventMultiplier
        }
      });
    }
    
    // Sort by priority (high demand first, then by confidence)
    return predictions.sort((a, b) => {
      if (a.level === 'high' && b.level !== 'high') return -1;
      if (a.level !== 'high' && b.level === 'high') return 1;
      return b.confidence - a.confidence;
    });
    
  } catch (error) {
    console.error('Error in demand prediction:', error);
    throw error;
  }
};

/**
 * Get seasonal multiplier based on month and category
 */
const getSeasonalMultiplier = (month, category) => {
  // Spring/Summer sports peak in warmer months
  const summerSports = ['Cricket', 'Football', 'Basketball', 'Tennis', 'Volleyball'];
  const winterSports = ['Hockey'];
  const yearRound = ['Badminton', 'Table Tennis'];
  
  // Peak summer months: April-July (3-6 in 0-indexed)
  // Peak winter months: November-February (10-1 in 0-indexed)
  
  if (summerSports.includes(category)) {
    if (month >= 3 && month <= 7) return 1.4; // High season
    if (month >= 8 && month <= 10) return 0.8; // Shoulder season
    return 0.5; // Low season
  }
  
  if (winterSports.includes(category)) {
    if (month >= 10 || month <= 1) return 1.3;
    if (month >= 8 && month <= 9) return 0.9;
    return 0.6;
  }
  
  if (yearRound.includes(category)) {
    // Indoor sports - consistent year round with slight winter increase
    if (month >= 10 || month <= 2) return 1.2;
    return 1.0;
  }
  
  return 1.0; // Default
};

/**
 * Detect anomalies in usage patterns
 */
const detectAnomalies = async () => {
  try {
    const anomalies = [];
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get all kits
    const kits = await Kit.find();
    
    for (const kit of kits) {
      // Get last week's transactions
      const recentIssues = await Transaction.countDocuments({
        kit: kit._id,
        type: 'issue',
        createdAt: { $gte: lastWeek }
      });
      
      // Get average for previous weeks
      const previousWeekStart = new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
      const previousIssues = await Transaction.countDocuments({
        kit: kit._id,
        type: 'issue',
        createdAt: { $gte: previousWeekStart, $lt: lastWeek }
      });
      
      // Detect spike or drop
      if (recentIssues > previousIssues * 2 && previousIssues > 0) {
        anomalies.push({
          kitId: kit._id,
          kitName: kit.name,
          type: 'usage_spike',
          severity: 'medium',
          message: `Usage spike detected: ${recentIssues} issues this week vs ${previousIssues} last week`,
          recentIssues,
          previousIssues
        });
      }
      
      // Detect stock anomaly
      if (kit.available === 0 && previousIssues > 0) {
        anomalies.push({
          kitId: kit._id,
          kitName: kit.name,
          type: 'stockout',
          severity: 'high',
          message: `${kit.name} is out of stock but had recent usage`,
          recentIssues
        });
      }
    }
    
    return anomalies;
    
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    throw error;
  }
};

/**
 * Get comprehensive demand forecast with academic calendar
 */
const getComprehensiveForecast = async () => {
  const predictions = await predictDemand();
  const quarterlyForecast = getQuarterlyForecast();
  
  // Group predictions by priority
  const highDemand = predictions.filter(p => p.level === 'high');
  const mediumDemand = predictions.filter(p => p.level === 'medium');
  const criticalStock = predictions.filter(p => p.factors.stockLevel === 'low' && p.level === 'high');
  
  return {
    summary: {
      totalKits: predictions.length,
      highDemandCount: highDemand.length,
      mediumDemandCount: mediumDemand.length,
      criticalStockCount: criticalStock.length,
      affectedByEvents: predictions.filter(p => p.factors.eventFactor).length
    },
    quarterlyForecast,
    highDemandKits: highDemand.slice(0, 10),
    criticalRestockNeeded: criticalStock,
    allPredictions: predictions
  };
};

module.exports = {
  predictDemand,
  detectAnomalies,
  getSeasonalMultiplier,
  getComprehensiveForecast,
  getQuarterlyForecast
};
