const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Kit = require('../models/Kit');

/**
 * AI Anomaly Detection System
 * Detects suspicious patterns and potential fraud/misuse
 */

const ANOMALY_RULES = {
  // Issue rate thresholds
  MAX_DAILY_ISSUES: 5,           // Max issues per day per user
  MAX_WEEKLY_ISSUES: 15,         // Max issues per week per user
  MAX_CONCURRENT_KITS: 5,        // Max kits a user can have at once
  
  // Return patterns
  MAX_LATE_RETURNS_RATIO: 0.7,   // 70% late returns is suspicious
  MIN_DAYS_BETWEEN_ISSUES: 1,    // Minimum 1 day between issues
  
  // Kit-specific
  HIGH_VALUE_KIT_THRESHOLD: 2000,  // Kits above this value are "high value"
  MAX_HIGH_VALUE_KITS: 2,        // Max high-value kits per user
  
  // Time-based
  SUSPICIOUS_HOURS: [0, 1, 2, 3, 4, 5], // Late night activity
  
  // Frequency
  RAPID_ISSUE_THRESHOLD: 3,      // 3+ issues within 1 hour
  
  // Damage patterns
  MAX_DAMAGE_REPORTS: 3            // Max damage reports before flagging
};

/**
 * Detect anomalies for a specific user
 */
const detectUserAnomalies = async (userId) => {
  try {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID provided');
    }

    // Check if userId is valid ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid user ID format');
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    const anomalies = [];
    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last1Hour = new Date(now - 60 * 60 * 1000);
    
    // Get user's transactions
    const recentTransactions = await Transaction.find({
      user: userId,
      createdAt: { $gte: last7Days }
    }).populate('kit', 'name category condition value');
    
    const issueTransactions = recentTransactions.filter(t => t.type === 'issue');
    const returnTransactions = recentTransactions.filter(t => t.type === 'return');
    
    // Check 1: Excessive daily issues
    const dailyIssues = issueTransactions.filter(t => t.createdAt >= last24Hours).length;
    if (dailyIssues > ANOMALY_RULES.MAX_DAILY_ISSUES) {
      anomalies.push({
        type: 'excessive_daily_issues',
        severity: 'high',
        message: `${dailyIssues} kits issued in last 24 hours (max: ${ANOMALY_RULES.MAX_DAILY_ISSUES})`,
        details: { count: dailyIssues, threshold: ANOMALY_RULES.MAX_DAILY_ISSUES },
        recommendation: 'Review user activity, possible misuse or proxy issuing'
      });
    }
    
    // Check 2: Excessive weekly issues
    if (issueTransactions.length > ANOMALY_RULES.MAX_WEEKLY_ISSUES) {
      anomalies.push({
        type: 'excessive_weekly_issues',
        severity: 'medium',
        message: `${issueTransactions.length} kits issued in last 7 days`,
        details: { count: issueTransactions.length, threshold: ANOMALY_RULES.MAX_WEEKLY_ISSUES },
        recommendation: 'Monitor for commercial use or unauthorized distribution'
      });
    }
    
    // Check 3: High late return ratio
    const lateReturns = returnTransactions.filter(t => {
      if (!t.returnDate || !t.dueDate) return false;
      return new Date(t.returnDate) > new Date(t.dueDate);
    });
    
    const lateRatio = returnTransactions.length > 0 ? lateReturns.length / returnTransactions.length : 0;
    if (lateRatio > ANOMALY_RULES.MAX_LATE_RETURNS_RATIO && returnTransactions.length >= 5) {
      anomalies.push({
        type: 'high_late_return_ratio',
        severity: 'medium',
        message: `${(lateRatio * 100).toFixed(0)}% late returns`,
        details: { lateCount: lateReturns.length, totalReturns: returnTransactions.length },
        recommendation: 'Consider requiring deposit or restricting future issues'
      });
    }
    
    // Check 4: Rapid successive issues
    const rapidIssues = issueTransactions.filter(t => t.createdAt >= last1Hour).length;
    if (rapidIssues >= ANOMALY_RULES.RAPID_ISSUE_THRESHOLD) {
      anomalies.push({
        type: 'rapid_successive_issues',
        severity: 'high',
        message: `${rapidIssues} kits issued within 1 hour`,
        details: { count: rapidIssues },
        recommendation: 'Possible automated abuse or unauthorized bulk issuing'
      });
    }
    
    // Check 5: Suspicious hours activity
    const suspiciousHourIssues = issueTransactions.filter(t => {
      const hour = new Date(t.createdAt).getHours();
      return ANOMALY_RULES.SUSPICIOUS_HOURS.includes(hour);
    });
    
    if (suspiciousHourIssues.length > 2) {
      anomalies.push({
        type: 'suspicious_hours_activity',
        severity: 'low',
        message: `${suspiciousHourIssues.length} issues during late night hours`,
        details: { hours: ANOMALY_RULES.SUSPICIOUS_HOURS },
        recommendation: 'Review if user has legitimate after-hours access'
      });
    }
    
    // Check 6: High-value kit concentration
    const highValueIssues = issueTransactions.filter(t => 
      t.kit && t.kit.value > ANOMALY_RULES.HIGH_VALUE_KIT_THRESHOLD
    );
    
    if (highValueIssues.length > ANOMALY_RULES.MAX_HIGH_VALUE_KITS) {
      anomalies.push({
        type: 'high_value_kit_concentration',
        severity: 'medium',
        message: `${highValueIssues.length} high-value kits issued`,
        details: { count: highValueIssues.length, threshold: ANOMALY_RULES.MAX_HIGH_VALUE_KITS },
        recommendation: 'Verify legitimate use of expensive equipment'
      });
    }
    
    // Check 7: Same kit type repeated
    const categoryCounts = {};
    issueTransactions.forEach(t => {
      if (t.kit && t.kit.category) {
        categoryCounts[t.kit.category] = (categoryCounts[t.kit.category] || 0) + 1;
      }
    });
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > 5) {
        anomalies.push({
          type: 'repeated_category_usage',
          severity: 'low',
          message: `${count} ${category} kits issued in 7 days`,
          details: { category, count },
          recommendation: 'May indicate commercial use or resale'
        });
      }
    });
    
    // Check 8: No returns (hoarding)
    const activeLoans = await Transaction.countDocuments({
      user: userId,
      type: 'issue',
      status: 'active'
    });
    
    if (activeLoans > ANOMALY_RULES.MAX_CONCURRENT_KITS) {
      anomalies.push({
        type: 'kit_hoarding',
        severity: 'high',
        message: `${activeLoans} active loans (max: ${ANOMALY_RULES.MAX_CONCURRENT_KITS})`,
        details: { activeLoans, maxAllowed: ANOMALY_RULES.MAX_CONCURRENT_KITS },
        recommendation: 'User may be hoarding equipment. Require immediate returns.'
      });
    }
    
    // Calculate overall risk score
    const riskWeights = { high: 30, medium: 15, low: 5 };
    const totalRiskScore = anomalies.reduce((sum, a) => sum + riskWeights[a.severity], 0);
    
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      anomalies,
      summary: {
        totalAnomalies: anomalies.length,
        highSeverity: anomalies.filter(a => a.severity === 'high').length,
        mediumSeverity: anomalies.filter(a => a.severity === 'medium').length,
        lowSeverity: anomalies.filter(a => a.severity === 'low').length,
        riskScore: Math.min(100, totalRiskScore),
        isFlagged: totalRiskScore >= 50
      },
      stats: {
        dailyIssues,
        weeklyIssues: issueTransactions.length,
        lateRatio: Math.round(lateRatio * 100),
        activeLoans
      },
      recommendations: generateAnomalyRecommendations(anomalies, totalRiskScore)
    };
    
  } catch (error) {
    console.error('Error detecting user anomalies:', error);
    throw error;
  }
};

/**
 * Detect system-wide anomalies
 */
const detectSystemAnomalies = async () => {
  try {
    const anomalies = [];
    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    
    // Check 1: Unusual spike in overall issues
    const todayIssues = await Transaction.countDocuments({
      type: 'issue',
      createdAt: { $gte: last24Hours }
    });
    
    const avgDailyIssues = await Transaction.countDocuments({
      type: 'issue',
      createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) }
    }) / 30;
    
    if (todayIssues > avgDailyIssues * 3) {
      anomalies.push({
        type: 'system_usage_spike',
        severity: 'medium',
        message: `Today's issues (${todayIssues}) is 3x above average (${Math.round(avgDailyIssues)})`,
        recommendation: 'Check for event or possible system abuse'
      });
    }
    
    // Check 2: Multiple users with suspicious patterns
    const users = await User.find();
    let flaggedUsers = 0;
    
    for (const user of users) {
      const userAnomalies = await detectUserAnomalies(user._id);
      if (userAnomalies.summary.isFlagged) {
        flaggedUsers++;
      }
    }
    
    if (flaggedUsers > users.length * 0.1) { // More than 10% users flagged
      anomalies.push({
        type: 'widespread_suspicious_activity',
        severity: 'high',
        message: `${flaggedUsers} users (${(flaggedUsers/users.length*100).toFixed(1)}%) show suspicious patterns`,
        recommendation: 'System-wide review needed. Possible coordinated misuse.'
      });
    }
    
    // Check 3: Missing high-value kits
    const overdueHighValue = await Transaction.find({
      status: 'overdue'
    }).populate('kit', 'name value');
    
    const highValueOverdue = overdueHighValue.filter(t => t.kit && t.kit.value > 2000);
    
    if (highValueOverdue.length > 5) {
      anomalies.push({
        type: 'high_value_overdue_concentration',
        severity: 'high',
        message: `${highValueOverdue.length} high-value kits overdue`,
        recommendation: 'Immediate recovery action required for expensive equipment'
      });
    }
    
    return {
      systemAnomalies: anomalies,
      summary: {
        totalAnomalies: anomalies.length,
        todayIssues,
        avgDailyIssues: Math.round(avgDailyIssues),
        flaggedUsersCount: flaggedUsers,
        highValueOverdueCount: highValueOverdue.length
      }
    };
    
  } catch (error) {
    console.error('Error detecting system anomalies:', error);
    throw error;
  }
};

/**
 * Generate recommendations based on anomalies
 */
const generateAnomalyRecommendations = (anomalies, riskScore) => {
  const recommendations = [];
  
  if (riskScore >= 70) {
    recommendations.push({
      priority: 'urgent',
      action: 'Suspend user account immediately',
      reason: 'High risk of fraud or misuse'
    });
    recommendations.push({
      priority: 'urgent',
      action: 'Review all active loans and require immediate returns',
      reason: 'Potential equipment hoarding'
    });
  }
  
  if (riskScore >= 50) {
    recommendations.push({
      priority: 'high',
      action: 'Require deposit for future issues',
      reason: 'Suspicious activity detected'
    });
    recommendations.push({
      priority: 'high',
      action: 'Limit to 1 kit per issue',
      reason: 'Prevent bulk hoarding'
    });
  }
  
  if (anomalies.some(a => a.type === 'excessive_daily_issues')) {
    recommendations.push({
      priority: 'medium',
      action: 'Verify user identity and purpose',
      reason: 'Unusually high daily activity'
    });
  }
  
  if (anomalies.some(a => a.type === 'high_late_return_ratio')) {
    recommendations.push({
      priority: 'medium',
      action: 'Send aggressive reminders before due dates',
      reason: 'Pattern of late returns'
    });
  }
  
  return recommendations;
};

/**
 * Batch scan all users for anomalies
 */
const batchAnomalyScan = async () => {
  try {
    const users = await User.find();
    const results = [];
    
    for (const user of users) {
      try {
        const analysis = await detectUserAnomalies(user._id);
        if (analysis.summary.isFlagged) {
          results.push(analysis);
        }
      } catch (error) {
        console.error(`Error scanning user ${user._id}:`, error);
      }
    }
    
    return {
      scannedUsers: users.length,
      flaggedUsers: results.length,
      results: results.sort((a, b) => b.summary.riskScore - a.summary.riskScore)
    };
    
  } catch (error) {
    console.error('Error in batch anomaly scan:', error);
    throw error;
  }
};

module.exports = {
  detectUserAnomalies,
  detectSystemAnomalies,
  batchAnomalyScan,
  ANOMALY_RULES
};
