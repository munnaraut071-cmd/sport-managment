const Kit = require('../models/Kit');
const { predictDemand } = require('./demandPrediction');

/**
 * AI Purchase Recommendation Engine
 * Generates smart purchase recommendations based on:
 * - Predicted demand
 * - Current stock levels
 * - Historical usage patterns
 * - Budget constraints
 */

const generateRecommendations = async () => {
  try {
    const predictions = await predictDemand();
    const recommendations = [];
    
    for (const prediction of predictions) {
      const { kitId, kitName, category, currentStock, predictedDemand, level, confidence, trend } = prediction;
      
      // Calculate recommended purchase quantity
      let recommendedQty = 0;
      let priority = 'low';
      let reason = '';
      
      // Stock deficit calculation
      const deficit = predictedDemand - currentStock;
      
      if (deficit > 0) {
        // We need more stock
        recommendedQty = Math.ceil(deficit * 1.2); // 20% buffer
        
        if (level === 'high' && confidence >= 80) {
          priority = 'high';
          reason = `Critical: Predicted demand (${predictedDemand}) exceeds current stock (${currentStock}) by ${deficit} units. High confidence prediction.`;
        } else if (level === 'medium' && confidence >= 60) {
          priority = 'medium';
          reason = `Moderate demand expected. Stock will be insufficient for predicted demand of ${predictedDemand} units.`;
        } else {
          priority = 'low';
          reason = `Low priority restock recommended to maintain buffer stock.`;
        }
      } else if (currentStock < 5) {
        // Critical low stock regardless of prediction
        recommendedQty = 10;
        priority = currentStock === 0 ? 'high' : 'medium';
        reason = `Critical stock level: Only ${currentStock} units remaining.`;
      }
      
      // Only add if we have a recommendation
      if (recommendedQty > 0) {
        // Calculate estimated cost (mock pricing based on category)
        const unitCost = getEstimatedUnitCost(category);
        const estimatedCost = recommendedQty * unitCost;
        
        recommendations.push({
          kitId,
          kitName,
          category,
          currentStock,
          predictedDemand,
          recommendedQty,
          priority,
          reason,
          confidence,
          trend,
          estimatedCost,
          unitCost,
          timeFrame: 'next 4 weeks',
          urgencyScore: calculateUrgencyScore(prediction, recommendedQty)
        });
      }
    }
    
    // Sort by priority and urgency
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.urgencyScore - a.urgencyScore;
    });
    
    return recommendations;
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  };
};

/**
 * Get estimated unit cost based on category
 */
const getEstimatedUnitCost = (category) => {
  const pricing = {
    'Cricket': 2500,
    'Football': 1500,
    'Badminton': 800,
    'Basketball': 1200,
    'Tennis': 3000,
    'Hockey': 2000,
    'Volleyball': 1000,
    'Table Tennis': 600,
    'Other': 1000
  };
  
  return pricing[category] || 1000;
};

/**
 * Calculate urgency score (0-100)
 */
const calculateUrgencyScore = (prediction, recommendedQty) => {
  let score = 0;
  
  // Base score from prediction confidence
  score += prediction.confidence * 0.3;
  
  // Add for high demand level
  if (prediction.level === 'high') score += 30;
  else if (prediction.level === 'medium') score += 15;
  
  // Add for low stock ratio
  const stockRatio = prediction.currentStock / (prediction.totalStock || 1);
  if (stockRatio < 0.2) score += 25;
  else if (stockRatio < 0.4) score += 15;
  
  // Add for increasing trend
  if (prediction.trend === 'increasing') score += 10;
  
  // Scale by recommended quantity importance
  if (recommendedQty > 20) score += 10;
  
  return Math.min(100, Math.round(score));
};

/**
 * Generate budget-aware recommendations
 */
const generateBudgetRecommendations = async (budgetLimit) => {
  try {
    const allRecommendations = await generateRecommendations();
    
    if (!budgetLimit) {
      return allRecommendations;
    }
    
    // Filter and adjust recommendations to fit budget
    const budgetRecommendations = [];
    let remainingBudget = budgetLimit;
    
    // First, add all high priority items
    for (const rec of allRecommendations.filter(r => r.priority === 'high')) {
      if (rec.estimatedCost <= remainingBudget) {
        budgetRecommendations.push(rec);
        remainingBudget -= rec.estimatedCost;
      } else {
        // Try to reduce quantity to fit budget
        const maxAffordableQty = Math.floor(remainingBudget / rec.unitCost);
        if (maxAffordableQty > 0) {
          budgetRecommendations.push({
            ...rec,
            recommendedQty: maxAffordableQty,
            estimatedCost: maxAffordableQty * rec.unitCost,
            note: 'Quantity reduced to fit budget'
          });
          remainingBudget = 0;
        }
      }
    }
    
    // Then add medium priority if budget allows
    if (remainingBudget > 0) {
      for (const rec of allRecommendations.filter(r => r.priority === 'medium')) {
        if (rec.estimatedCost <= remainingBudget) {
          budgetRecommendations.push(rec);
          remainingBudget -= rec.estimatedCost;
        }
      }
    }
    
    return {
      recommendations: budgetRecommendations,
      totalCost: budgetLimit - remainingBudget,
      remainingBudget,
      withinBudget: remainingBudget >= 0
    };
    
  } catch (error) {
    console.error('Error generating budget recommendations:', error);
    throw error;
  }
};

/**
 * Get seasonal buying recommendations
 */
const getSeasonalRecommendations = async () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  
  // Define peak seasons
  const seasonInfo = {
    spring: { months: [2, 3, 4], sports: ['Cricket', 'Football', 'Tennis'] },
    summer: { months: [5, 6, 7], sports: ['Cricket', 'Football', 'Basketball', 'Volleyball'] },
    monsoon: { months: [8, 9], sports: ['Badminton', 'Table Tennis'] },
    winter: { months: [10, 11, 0, 1], sports: ['Hockey', 'Football', 'Badminton'] }
  };
  
  // Determine current season
  let currentSeason = 'spring';
  for (const [season, info] of Object.entries(seasonInfo)) {
    if (info.months.includes(currentMonth)) {
      currentSeason = season;
      break;
    }
  }
  
  // Get recommendations for upcoming season sports
  const upcomingSports = seasonInfo[currentSeason].sports;
  const kits = await Kit.find({ category: { $in: upcomingSports } });
  
  return {
    season: currentSeason,
    recommendedSports: upcomingSports,
    kitCount: kits.length,
    message: `Prepare inventory for ${currentSeason} season sports: ${upcomingSports.join(', ')}`
  };
};

module.exports = {
  generateRecommendations,
  generateBudgetRecommendations,
  getSeasonalRecommendations,
  getEstimatedUnitCost
};
