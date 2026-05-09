const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * User Behavior Analysis
 * Analyzes user patterns to:
 * - Calculate risk scores
 * - Identify late return patterns
 * - Predict future behavior
 * - Generate user classifications
 */

const analyzeUserBehavior = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get all user transactions
    const transactions = await Transaction.find({ user: userId })
      .populate('kit', 'name category')
      .sort({ createdAt: -1 });
    
    // Calculate metrics
    const totalTransactions = transactions.length;
    const issueTransactions = transactions.filter(t => t.type === 'issue');
    const returnTransactions = transactions.filter(t => t.type === 'return');
    
    // Calculate late returns
    const lateReturns = returnTransactions.filter(t => {
      if (!t.returnDate || !t.dueDate) return false;
      return new Date(t.returnDate) > new Date(t.dueDate);
    });
    
    // Calculate average return time
    const returnTimes = returnTransactions
      .filter(t => t.returnDate && t.issueDate)
      .map(t => {
        const issue = new Date(t.issueDate);
        const ret = new Date(t.returnDate);
        return (ret - issue) / (1000 * 60 * 60 * 24); // days
      });
    
    const avgReturnTime = returnTimes.length > 0 
      ? returnTimes.reduce((a, b) => a + b, 0) / returnTimes.length 
      : 0;
    
    // Calculate on-time rate
    const onTimeReturns = returnTransactions.length - lateReturns.length;
    const onTimeRate = returnTransactions.length > 0 
      ? (onTimeReturns / returnTransactions.length * 100).toFixed(1)
      : 100;
    
    // Identify preferred categories
    const categoryCounts = {};
    issueTransactions.forEach(t => {
      if (t.kit && t.kit.category) {
        categoryCounts[t.kit.category] = (categoryCounts[t.kit.category] || 0) + 1;
      }
    });
    
    const preferredCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));
    
    // Calculate risk score
    const riskScore = calculateRiskScore({
      totalTransactions,
      lateReturns: lateReturns.length,
      avgReturnTime,
      overdueNow: transactions.filter(t => t.status === 'overdue').length
    });
    
    // Determine user classification
    const classification = classifyUser({
      riskScore,
      onTimeRate: parseFloat(onTimeRate),
      totalTransactions,
      avgReturnTime
    });
    
    // Generate recommendations
    const recommendations = generateUserRecommendations({
      riskScore,
      classification,
      lateReturns: lateReturns.length,
      avgReturnTime
    });
    
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      summary: {
        totalTransactions,
        totalIssues: issueTransactions.length,
        totalReturns: returnTransactions.length,
        lateReturns: lateReturns.length,
        overdueNow: transactions.filter(t => t.status === 'overdue').length,
        onTimeRate: parseFloat(onTimeRate),
        avgReturnTime: Math.round(avgReturnTime * 10) / 10,
        riskScore,
        riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
        classification
      },
      preferences: {
        preferredCategories,
        mostUsedKit: issueTransactions.length > 0 ? issueTransactions[0].kit : null
      },
      patterns: {
        returnTimeTrend: calculateReturnTrend(returnTimes),
        activityLevel: totalTransactions > 20 ? 'high' : totalTransactions > 5 ? 'medium' : 'low'
      },
      recommendations,
      recentTransactions: transactions.slice(0, 5)
    };
    
  } catch (error) {
    console.error('Error analyzing user behavior:', error);
    throw error;
  }
};

/**
 * Calculate risk score (0-100)
 */
const calculateRiskScore = (metrics) => {
  let score = 0;
  const { totalTransactions, lateReturns, avgReturnTime, overdueNow } = metrics;
  
  if (totalTransactions === 0) return 0;
  
  // Late return ratio (40% weight)
  const lateRatio = lateReturns / totalTransactions;
  score += lateRatio * 40;
  
  // Average return time penalty (30% weight)
  // Assuming standard loan period is 7 days
  if (avgReturnTime > 7) {
    score += Math.min(30, (avgReturnTime - 7) * 3);
  }
  
  // Current overdue penalty (30% weight)
  score += Math.min(30, overdueNow * 10);
  
  return Math.round(Math.min(100, score));
};

/**
 * Classify user based on behavior
 */
const classifyUser = (metrics) => {
  const { riskScore, onTimeRate, totalTransactions, avgReturnTime } = metrics;
  
  if (riskScore >= 70) {
    return {
      type: 'high_risk',
      label: 'High Risk',
      description: 'User has significant late return history',
      action: 'Require deposit or restrict issues'
    };
  }
  
  if (onTimeRate >= 95 && totalTransactions > 10) {
    return {
      type: 'exemplary',
      label: 'Exemplary User',
      description: 'Consistently returns items on time',
      action: 'Offer extended loan periods'
    };
  }
  
  if (totalTransactions > 20 && onTimeRate >= 80) {
    return {
      type: 'regular',
      label: 'Regular User',
      description: 'Active user with good track record',
      action: 'Standard privileges'
    };
  }
  
  if (totalTransactions < 5) {
    return {
      type: 'new',
      label: 'New User',
      description: 'Limited transaction history',
      action: 'Monitor usage patterns'
    };
  }
  
  return {
    type: 'standard',
    label: 'Standard User',
    description: 'Normal usage patterns',
    action: 'Standard privileges'
  };
};

/**
 * Calculate return time trend
 */
const calculateReturnTrend = (returnTimes) => {
  if (returnTimes.length < 3) return 'insufficient_data';
  
  // Simple trend: compare first half avg vs second half avg
  const mid = Math.floor(returnTimes.length / 2);
  const firstHalf = returnTimes.slice(0, mid);
  const secondHalf = returnTimes.slice(mid);
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const diff = secondAvg - firstAvg;
  
  if (diff > 2) return 'improving'; // Returning faster
  if (diff < -2) return 'declining'; // Taking longer
  return 'stable';
};

/**
 * Generate recommendations for user management
 */
const generateUserRecommendations = (metrics) => {
  const { riskScore, classification, lateReturns, avgReturnTime } = metrics;
  const recommendations = [];
  
  if (riskScore >= 70) {
    recommendations.push({
      type: 'restriction',
      priority: 'high',
      action: 'Limit concurrent issues to 1 item',
      reason: 'High risk of late returns'
    });
    recommendations.push({
      type: 'reminder',
      priority: 'high',
      action: 'Send early reminders (2 days before due)',
      reason: 'Pattern of late returns detected'
    });
  }
  
  if (riskScore >= 40 && riskScore < 70) {
    recommendations.push({
      type: 'reminder',
      priority: 'medium',
      action: 'Send reminder 1 day before due date',
      reason: 'Moderate risk user'
    });
  }
  
  if (classification.type === 'exemplary') {
    recommendations.push({
      type: 'reward',
      priority: 'low',
      action: 'Offer extended loan period (14 days)',
      reason: 'Excellent track record'
    });
  }
  
  if (avgReturnTime > 10) {
    recommendations.push({
      type: 'monitoring',
      priority: 'medium',
      action: 'Monitor return patterns',
      reason: 'Extended average return time'
    });
  }
  
  return recommendations;
};

/**
 * Batch analyze all users
 */
const batchAnalyzeUsers = async (options = {}) => {
  try {
    const { minTransactions = 0, maxRiskScore = 100 } = options;
    
    const users = await User.find({
      totalIssues: { $gte: minTransactions },
      riskScore: { $lte: maxRiskScore }
    });
    
    const analyses = [];
    
    for (const user of users) {
      try {
        const analysis = await analyzeUserBehavior(user._id);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing user ${user._id}:`, error);
      }
    }
    
    return analyses;
    
  } catch (error) {
    console.error('Error in batch analysis:', error);
    throw error;
  }
};

/**
 * Generate smart reminder schedule based on user behavior
 * Learns from user's return patterns and customizes reminder timing
 */
const generateSmartReminderSchedule = async (userId) => {
  try {
    const user = await User.findById(userId);
    const transactions = await Transaction.find({ user: userId, type: 'return' })
      .sort({ createdAt: -1 })
      .limit(10);
    
    if (!user || transactions.length === 0) {
      // Default schedule for new users
      return {
        userId,
        schedule: 'standard',
        reminders: [
          { daysBeforeDue: 1, type: 'email', message: 'Your kit is due tomorrow' },
          { daysBeforeDue: 0, type: 'push', message: 'Your kit is due today' }
        ],
        reasoning: 'New user - using default schedule'
      };
    }
    
    // Analyze return patterns
    const returnDelays = transactions
      .filter(t => t.returnDate && t.dueDate)
      .map(t => {
        const due = new Date(t.dueDate);
        const returned = new Date(t.returnDate);
        return Math.ceil((returned - due) / (1000 * 60 * 60 * 24)); // days late (negative = early)
      });
    
    const avgDelay = returnDelays.reduce((a, b) => a + b, 0) / returnDelays.length;
    const lateCount = returnDelays.filter(d => d > 0).length;
    const lateRatio = lateCount / returnDelays.length;
    
    // Customize reminder schedule based on behavior
    let schedule = 'standard';
    let reminders = [];
    let reasoning = '';
    
    if (lateRatio > 0.7 || avgDelay > 2) {
      // High risk user - aggressive reminders
      schedule = 'intensive';
      reminders = [
        { daysBeforeDue: 3, type: 'email', message: 'Upcoming due date - plan your return' },
        { daysBeforeDue: 1, type: 'email+push', message: 'Your kit is due tomorrow - please return soon' },
        { daysBeforeDue: 0, type: 'email+push+sms', message: 'URGENT: Your kit is due today' },
        { daysAfterDue: 1, type: 'email+push', message: 'Your kit is 1 day overdue' }
      ];
      reasoning = `High late return ratio (${(lateRatio * 100).toFixed(0)}%). Average delay: ${avgDelay.toFixed(1)} days.`;
    } else if (lateRatio > 0.3 || avgDelay > 0) {
      // Moderate risk - early reminders
      schedule = 'early';
      reminders = [
        { daysBeforeDue: 2, type: 'email', message: 'Reminder: Kit due in 2 days' },
        { daysBeforeDue: 0, type: 'push', message: 'Your kit is due today' },
        { daysAfterDue: 1, type: 'email', message: 'Overdue notice' }
      ];
      reasoning = `Moderate risk user. Some late returns detected (${(lateRatio * 100).toFixed(0)}%).`;
    } else {
      // Low risk - minimal reminders
      schedule = 'minimal';
      reminders = [
        { daysBeforeDue: 0, type: 'push', message: 'Your kit is due today' }
      ];
      reasoning = `Excellent track record. On-time rate: ${((1 - lateRatio) * 100).toFixed(0)}%.`;
    }
    
    // Add personalized message based on preferences
    const preferredCategories = await getUserPreferences(userId);
    if (preferredCategories.length > 0) {
      reasoning += ` Prefers: ${preferredCategories.join(', ')}.`;
    }
    
    return {
      userId,
      userName: user.name,
      schedule,
      reminders,
      behaviorMetrics: {
        lateRatio,
        avgDelay: Math.round(avgDelay * 10) / 10,
        totalReturns: transactions.length
      },
      reasoning,
      preferredCategories
    };
    
  } catch (error) {
    console.error('Error generating smart reminder schedule:', error);
    throw error;
  }
};

/**
 * Get user sport preferences from history
 */
const getUserPreferences = async (userId) => {
  const transactions = await Transaction.find({ user: userId, type: 'issue' })
    .populate('kit', 'category')
    .sort({ createdAt: -1 })
    .limit(20);
  
  const categoryCounts = {};
  transactions.forEach(t => {
    if (t.kit && t.kit.category) {
      categoryCounts[t.kit.category] = (categoryCounts[t.kit.category] || 0) + 1;
    }
  });
  
  return Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);
};

/**
 * Predict if user will return on time for current active loans
 */
const predictReturnTimeliness = async (userId) => {
  try {
    const user = await User.findById(userId);
    const activeLoans = await Transaction.find({ 
      user: userId, 
      type: 'issue',
      status: 'active'
    }).populate('kit', 'name category');
    
    if (!user || activeLoans.length === 0) {
      return { userId, predictions: [] };
    }
    
    // Get user's historical behavior
    const history = await analyzeUserBehavior(userId);
    const { riskScore, riskLevel } = history.summary;
    
    const predictions = activeLoans.map(loan => {
      const dueDate = new Date(loan.dueDate);
      const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
      
      // Predict based on risk score
      let onTimeProbability;
      if (riskLevel === 'low') onTimeProbability = 0.95;
      else if (riskLevel === 'medium') onTimeProbability = 0.75;
      else onTimeProbability = 0.45;
      
      // Adjust for days remaining
      if (daysUntilDue < 2) onTimeProbability *= 0.9;
      if (daysUntilDue > 7) onTimeProbability *= 1.1;
      
      return {
        transactionId: loan._id,
        kitName: loan.kit.name,
        category: loan.kit.category,
        dueDate: loan.dueDate,
        daysUntilDue,
        onTimeProbability: Math.min(1, Math.round(onTimeProbability * 100) / 100),
        predictedReturnDate: new Date(dueDate.getTime() + (riskScore > 50 ? 2 : 0) * 24 * 60 * 60 * 1000),
        riskLevel,
        recommendedAction: riskScore > 50 ? 'Send early reminder' : 'Standard reminder'
      };
    });
    
    return {
      userId,
      userName: user.name,
      overallRiskLevel: riskLevel,
      riskScore,
      activeLoans: predictions.length,
      predictions
    };
    
  } catch (error) {
    console.error('Error predicting return timeliness:', error);
    throw error;
  }
};

module.exports = {
  analyzeUserBehavior,
  calculateRiskScore,
  classifyUser,
  batchAnalyzeUsers,
  generateSmartReminderSchedule,
  predictReturnTimeliness,
  getUserPreferences
};
