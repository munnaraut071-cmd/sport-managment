const Kit = require('../models/Kit');
const Transaction = require('../models/Transaction');

/**
 * Predictive Maintenance System
 * AI predicts when kits will wear out and need replacement
 */

// Lifecycle rules by category
const LIFECYCLE_RULES = {
  'Cricket': {
    bat: { maxUses: 50, warningThreshold: 40 },
    ball: { maxUses: 30, warningThreshold: 25 },
    pads: { maxUses: 100, warningThreshold: 80 },
    gloves: { maxUses: 80, warningThreshold: 65 },
    helmet: { maxUses: 150, warningThreshold: 120 },
    default: { maxUses: 60, warningThreshold: 50 }
  },
  'Football': {
    ball: { maxUses: 40, warningThreshold: 35 },
    studs: { maxUses: 70, warningThreshold: 60 },
    shinGuards: { maxUses: 100, warningThreshold: 85 },
    default: { maxUses: 50, warningThreshold: 42 }
  },
  'Badminton': {
    racket: { maxUses: 80, warningThreshold: 70 },
    shuttlecock: { maxUses: 20, warningThreshold: 18 },
    default: { maxUses: 50, warningThreshold: 42 }
  },
  'Basketball': {
    ball: { maxUses: 60, warningThreshold: 50 },
    default: { maxUses: 50, warningThreshold: 42 }
  },
  'Tennis': {
    racket: { maxUses: 100, warningThreshold: 85 },
    balls: { maxUses: 25, warningThreshold: 22 },
    default: { maxUses: 60, warningThreshold: 50 }
  },
  'Hockey': {
    stick: { maxUses: 70, warningThreshold: 60 },
    ball: { maxUses: 35, warningThreshold: 30 },
    default: { maxUses: 50, warningThreshold: 42 }
  },
  'Volleyball': {
    ball: { maxUses: 50, warningThreshold: 42 },
    default: { maxUses: 45, warningThreshold: 38 }
  },
  'Table Tennis': {
    bat: { maxUses: 120, warningThreshold: 100 },
    ball: { maxUses: 15, warningThreshold: 12 },
    default: { maxUses: 80, warningThreshold: 70 }
  }
};

// Condition degradation factors
const DEGRADATION_FACTORS = {
  outdoor: 1.3,      // Outdoor sports wear faster
  indoor: 1.0,       // Normal wear
  roughUsage: 1.5,   // High wear from rough users
  carefulUsage: 0.8  // Lower wear from careful users
};

/**
 * Calculate health score for a kit
 */
const calculateKitHealth = async (kitId) => {
  try {
    const kit = await Kit.findById(kitId);
    if (!kit) throw new Error('Kit not found');
    
    // Get all transactions for this kit
    const transactions = await Transaction.find({
      kit: kitId,
      type: 'issue'
    }).populate('user', 'riskScore');
    
    // Base metrics
    const totalIssues = transactions.length;
    const totalReturns = await Transaction.countDocuments({
      kit: kitId,
      type: 'return'
    });
    
    // Get lifecycle rules
    const categoryRules = LIFECYCLE_RULES[kit.category] || { default: { maxUses: 50, warningThreshold: 42 } };
    const rules = categoryRules[kit.subCategory || 'default'] || categoryRules.default;
    
    // Calculate wear factor based on user risk scores
    let wearMultiplier = 1.0;
    transactions.forEach(t => {
      if (t.user && t.user.riskScore > 50) {
        wearMultiplier += 0.1; // High-risk users cause more wear
      }
    });
    
    // Calculate effective uses
    const effectiveUses = Math.round(totalIssues * wearMultiplier);
    
    // Calculate health percentage
    const healthPercent = Math.max(0, Math.round((1 - effectiveUses / rules.maxUses) * 100));
    
    // Determine status
    let status = 'good';
    let action = 'none';
    let urgency = 'low';
    
    if (healthPercent <= 0) {
      status = 'replace';
      action = 'Replace immediately';
      urgency = 'urgent';
    } else if (healthPercent <= 20) {
      status = 'critical';
      action = 'Plan replacement';
      urgency = 'high';
    } else if (healthPercent <= 40) {
      status = 'worn';
      action = 'Schedule maintenance';
      urgency = 'medium';
    } else if (effectiveUses >= rules.warningThreshold) {
      status = 'fair';
      action = 'Monitor closely';
      urgency = 'low';
    }
    
    // Calculate estimated remaining uses
    const remainingUses = Math.max(0, rules.maxUses - effectiveUses);
    
    // Estimate replacement date based on usage frequency
    const recentTransactions = await Transaction.find({
      kit: kitId,
      type: 'issue',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const monthlyUsage = recentTransactions.length;
    const estimatedDaysRemaining = monthlyUsage > 0 
      ? Math.round(remainingUses / monthlyUsage * 30)
      : 90; // Default 3 months if no recent usage
    
    const estimatedReplacementDate = new Date(Date.now() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);
    
    return {
      kit: {
        _id: kit._id,
        name: kit.name,
        category: kit.category,
        subCategory: kit.subCategory || 'default'
      },
      health: {
        percentage: healthPercent,
        status,
        effectiveUses,
        totalIssues,
        remainingUses,
        maxUses: rules.maxUses
      },
      maintenance: {
        action,
        urgency,
        estimatedReplacementDate,
        estimatedDaysRemaining,
        lastMaintenance: kit.lastMaintenance || null
      },
      factors: {
        wearMultiplier: Math.round(wearMultiplier * 100) / 100,
        highRiskUserUses: transactions.filter(t => t.user && t.user.riskScore > 50).length
      }
    };
    
  } catch (error) {
    console.error('Error calculating kit health:', error);
    throw error;
  }
};

/**
 * Get maintenance schedule for all kits
 */
const getMaintenanceSchedule = async () => {
  try {
    const kits = await Kit.find({ status: 'active' });
    const healthReports = [];
    
    for (const kit of kits) {
      try {
        const health = await calculateKitHealth(kit._id);
        healthReports.push(health);
      } catch (error) {
        console.error(`Error analyzing kit ${kit._id}:`, error);
      }
    }
    
    // Categorize by urgency
    const urgent = healthReports.filter(h => h.maintenance.urgency === 'urgent');
    const high = healthReports.filter(h => h.maintenance.urgency === 'high');
    const medium = healthReports.filter(h => h.maintenance.urgency === 'medium');
    const low = healthReports.filter(h => h.maintenance.urgency === 'low');
    
    // Calculate costs
    const replacementCosts = urgent.reduce((sum, h) => {
      const unitCost = getEstimatedReplacementCost(h.kit.category);
      return sum + unitCost;
    }, 0);
    
    return {
      summary: {
        totalKits: kits.length,
        urgentReplacements: urgent.length,
        highPriority: high.length,
        mediumPriority: medium.length,
        goodCondition: low.length,
        estimatedReplacementCost: replacementCosts
      },
      schedule: {
        replaceNow: urgent,
        planReplacement: high,
        monitor: medium,
        healthy: low
      },
      upcomingReplacements: [...urgent, ...high]
        .sort((a, b) => a.maintenance.estimatedDaysRemaining - b.maintenance.estimatedDaysRemaining)
        .slice(0, 10)
    };
    
  } catch (error) {
    console.error('Error getting maintenance schedule:', error);
    throw error;
  }
};

/**
 * Get estimated replacement cost
 */
const getEstimatedReplacementCost = (category) => {
  const costs = {
    'Cricket': 2500,
    'Football': 1500,
    'Badminton': 800,
    'Basketball': 1200,
    'Tennis': 3000,
    'Hockey': 2000,
    'Volleyball': 1000,
    'Table Tennis': 600
  };
  return costs[category] || 1000;
};

/**
 * Generate maintenance alert
 */
const generateMaintenanceAlerts = async () => {
  try {
    const schedule = await getMaintenanceSchedule();
    const alerts = [];
    
    // Urgent replacements
    if (schedule.summary.urgentReplacements > 0) {
      alerts.push({
        type: 'maintenance',
        severity: 'urgent',
        title: 'Kits Need Immediate Replacement',
        message: `${schedule.summary.urgentReplacements} kits have reached end of life`,
        count: schedule.summary.urgentReplacements,
        estimatedCost: schedule.summary.estimatedReplacementCost,
        action: 'Review and replace kits immediately',
        kits: schedule.schedule.replaceNow.map(k => k.kit.name)
      });
    }
    
    // High priority - plan ahead
    if (schedule.summary.highPriority > 0) {
      alerts.push({
        type: 'maintenance',
        severity: 'high',
        title: 'Plan Kit Replacements',
        message: `${schedule.summary.highPriority} kits need replacement soon`,
        count: schedule.summary.highPriority,
        action: 'Add to next purchase order',
        kits: schedule.schedule.planReplacement.slice(0, 5).map(k => k.kit.name)
      });
    }
    
    // Budget forecast for next quarter
    const nextQuarterCost = [...schedule.schedule.replaceNow, ...schedule.schedule.planReplacement]
      .slice(0, 20)
      .reduce((sum, k) => sum + getEstimatedReplacementCost(k.kit.category), 0);
    
    if (nextQuarterCost > 0) {
      alerts.push({
        type: 'budget',
        severity: 'info',
        title: 'Quarterly Maintenance Budget',
        message: `Estimated ₹${nextQuarterCost} needed for kit replacements`,
        estimatedCost: nextQuarterCost,
        action: 'Allocate budget for equipment maintenance'
      });
    }
    
    return {
      alerts,
      summary: schedule.summary,
      maintenanceSchedule: schedule
    };
    
  } catch (error) {
    console.error('Error generating maintenance alerts:', error);
    throw error;
  }
};

/**
 * Record maintenance activity
 */
const recordMaintenance = async (kitId, maintenanceData) => {
  try {
    const kit = await Kit.findById(kitId);
    if (!kit) throw new Error('Kit not found');
    
    // Add maintenance record
    if (!kit.maintenanceHistory) {
      kit.maintenanceHistory = [];
    }
    
    kit.maintenanceHistory.push({
      date: new Date(),
      type: maintenanceData.type,
      description: maintenanceData.description,
      cost: maintenanceData.cost,
      performedBy: maintenanceData.performedBy
    });
    
    kit.lastMaintenance = new Date();
    
    // Update condition if provided
    if (maintenanceData.newCondition) {
      kit.condition = maintenanceData.newCondition;
    }
    
    await kit.save();
    
    return {
      success: true,
      message: 'Maintenance recorded successfully',
      kit: {
        _id: kit._id,
        name: kit.name,
        lastMaintenance: kit.lastMaintenance,
        maintenanceCount: kit.maintenanceHistory.length
      }
    };
    
  } catch (error) {
    console.error('Error recording maintenance:', error);
    throw error;
  }
};

module.exports = {
  calculateKitHealth,
  getMaintenanceSchedule,
  generateMaintenanceAlerts,
  recordMaintenance,
  getEstimatedReplacementCost,
  LIFECYCLE_RULES
};
