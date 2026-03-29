const Item = require('../models/Item');

/**
 * Machine Learning Model for Anomaly Detection in Kit Usage Patterns
 * 
 * Detects:
 * - Unusual issue/return patterns
 * - Suspicious activity (rapid issues, high damage rates)
 * - Deviation from historical trends
 * - Category-wise anomalies
 */
class AnomalyDetector {
  // Configuration thresholds
  static config = {
    zScoreThreshold: 2.5,           // Standard deviations for anomaly
    dailyIssueThreshold: 50,        // Max normal daily issues
    damageRateThreshold: 0.15,      // 15% damage rate is anomaly
    lossRateThreshold: 0.10,        // 10% loss rate is anomaly
    returnRateThreshold: 0.05,      // 5% return rate is anomaly
    velocityThreshold: 3.0,         // 3x normal velocity
    minHistoricalDataPoints: 10     // Min data needed for analysis
  };

  /**
   * Calculate statistical metrics for a dataset
   * Returns: { mean, stdDev, min, max, median }
   */
  static calculateStatistics(data) {
    if (data.length === 0) return null;

    // Mean
    const mean = data.reduce((a, b) => a + b, 0) / data.length;

    // Standard Deviation
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    // Min & Max
    const min = Math.min(...data);
    const max = Math.max(...data);

    // Median
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return { mean, stdDev, min, max, median };
  }

  /**
   * Z-Score based anomaly detection
   * Identifies values that deviate significantly from mean
   */
  static detectZScoreAnomalies(item) {
    const historicalData = [
      item.issued,
      item.returned,
      item.damaged,
      item.lost
    ];

    const stats = this.calculateStatistics(historicalData);
    if (!stats || stats.stdDev === 0) return [];

    const anomalies = [];

    // Check issue velocity
    if (item.issued > 0) {
      const zScore = (item.issued - stats.mean) / stats.stdDev;
      if (Math.abs(zScore) > this.config.zScoreThreshold) {
        anomalies.push({
          type: 'issue_velocity',
          severity: zScore > 0 ? 'high' : 'low',
          zScore: zScore.toFixed(2),
          value: item.issued,
          message: `Issue count (${item.issued}) is ${Math.abs(zScore).toFixed(1)}σ away from normal`
        });
      }
    }

    return anomalies;
  }

  /**
   * Isolation Forest-style anomaly detection
   * Simple tree-based approach to identify outliers
   */
  static detectIsolationForestAnomalies(item) {
    const anomalies = [];

    // Feature 1: Damage Rate Anomaly
    if (item.quantity > 0) {
      const damageRate = item.damaged / item.quantity;
      if (damageRate > this.config.damageRateThreshold) {
        anomalies.push({
          type: 'high_damage_rate',
          severity: damageRate > 0.25 ? 'critical' : 'high',
          value: (damageRate * 100).toFixed(2) + '%',
          threshold: (this.config.damageRateThreshold * 100).toFixed(2) + '%',
          message: `Damage rate (${(damageRate * 100).toFixed(1)}%) exceeds threshold`
        });
      }
    }

    // Feature 2: Loss Rate Anomaly
    if (item.quantity > 0) {
      const lossRate = item.lost / item.quantity;
      if (lossRate > this.config.lossRateThreshold) {
        anomalies.push({
          type: 'high_loss_rate',
          severity: lossRate > 0.15 ? 'critical' : 'high',
          value: (lossRate * 100).toFixed(2) + '%',
          threshold: (this.config.lossRateThreshold * 100).toFixed(2) + '%',
          message: `Loss rate (${(lossRate * 100).toFixed(1)}%) exceeds threshold`
        });
      }
    }

    // Feature 3: Return Rate Anomaly
    if (item.issued > 5) {
      const returnRate = item.returned / item.issued;
      if (returnRate > this.config.returnRateThreshold) {
        anomalies.push({
          type: 'high_return_rate',
          severity: 'medium',
          value: (returnRate * 100).toFixed(2) + '%',
          threshold: (this.config.returnRateThreshold * 100).toFixed(2) + '%',
          message: `Return rate (${(returnRate * 100).toFixed(1)}%) exceeds threshold`
        });
      }
    }

    // Feature 4: Unusual Issue Velocity
    if (item.issued > this.config.dailyIssueThreshold) {
      anomalies.push({
        type: 'high_issue_velocity',
        severity: 'medium',
        value: item.issued,
        threshold: this.config.dailyIssueThreshold,
        message: `High issue count (${item.issued}) - possible mass distribution`
      });
    }

    // Feature 5: Suspicious Pattern (high damage + high loss)
    if (item.damaged > 5 && item.lost > 5) {
      const combinedRate = (item.damaged + item.lost) / item.quantity;
      if (combinedRate > 0.25) {
        anomalies.push({
          type: 'suspicious_pattern',
          severity: 'critical',
          value: (combinedRate * 100).toFixed(2) + '%',
          message: `Suspicious pattern: ${item.damaged} damaged + ${item.lost} lost units`
        });
      }
    }

    return anomalies;
  }

  /**
   * Deviation from category baseline
   * Detects if an item behaves differently from its category
   */
  static async detectCategoryDeviations(item, categoryItems) {
    const anomalies = [];

    if (!categoryItems || categoryItems.length < this.config.minHistoricalDataPoints) {
      return [];
    }

    // Calculate category averages
    const avgIssued = categoryItems.reduce((sum, i) => sum + i.issued, 0) / categoryItems.length;
    const avgDamaged = categoryItems.reduce((sum, i) => sum + i.damaged, 0) / categoryItems.length;
    const avgLost = categoryItems.reduce((sum, i) => sum + i.lost, 0) / categoryItems.length;

    // Check if this item significantly deviates from category
    if (item.issued > avgIssued * this.config.velocityThreshold) {
      anomalies.push({
        type: 'category_deviation_issued',
        severity: 'medium',
        value: item.issued,
        categoryAverage: avgIssued.toFixed(0),
        message: `This kit (${item.issued} issued) is ${(item.issued / avgIssued).toFixed(1)}x category average`,
        category: item.category
      });
    }

    if (item.damaged > avgDamaged * this.config.velocityThreshold && item.damaged > 3) {
      anomalies.push({
        type: 'category_deviation_damage',
        severity: 'high',
        value: item.damaged,
        categoryAverage: avgDamaged.toFixed(0),
        message: `This kit has ${(item.damaged / (avgDamaged || 1)).toFixed(1)}x more damage than category average`,
        category: item.category
      });
    }

    if (item.lost > avgLost * this.config.velocityThreshold && item.lost > 2) {
      anomalies.push({
        type: 'category_deviation_lost',
        severity: 'high',
        value: item.lost,
        categoryAverage: avgLost.toFixed(0),
        message: `This kit has ${(item.lost / (avgLost || 1)).toFixed(1)}x more lost units than category average`,
        category: item.category
      });
    }

    return anomalies;
  }

  /**
   * Temporal anomaly detection
   * Detects sudden changes in patterns
   */
  static detectTemporalAnomalies(item) {
    const anomalies = [];

    // Check if recently issued but no returns (could be lost)
    if (item.issued > item.returned && item.issued > 10 && item.returned === 0) {
      anomalies.push({
        type: 'missing_returns',
        severity: 'high',
        value: item.issued,
        returned: item.returned,
        message: `${item.issued} units issued but none returned - possible loss event`
      });
    }

    // Check rapid turnover pattern
    if (item.issued > 0 && item.returned > 0) {
      const turnoverRatio = item.returned / item.issued;
      if (turnoverRatio > 0.8) {
        anomalies.push({
          type: 'rapid_turnover',
          severity: 'medium',
          value: (turnoverRatio * 100).toFixed(1) + '%',
          message: `High return/issue ratio (${(turnoverRatio * 100).toFixed(1)}%) - possible test distribution`
        });
      }
    }

    return anomalies;
  }

  /**
   * Ensemble anomaly detection
   * Combines multiple detection methods
   */
  static async detectAnomalies(itemId) {
    try {
      const item = await Item.findById(itemId);
      if (!item) {
        return { success: false, message: 'Item not found' };
      }

      // Get category items for comparison
      const categoryItems = await Item.find({ category: item.category, _id: { $ne: itemId } });

      // Run all detection methods
      const zScoreAnomalies = this.detectZScoreAnomalies(item);
      const isolationAnomalies = this.detectIsolationForestAnomalies(item);
      const categoryAnomalies = await this.detectCategoryDeviations(item, categoryItems);
      const temporalAnomalies = this.detectTemporalAnomalies(item);

      // Combine and score anomalies
      const allAnomalies = [
        ...zScoreAnomalies,
        ...isolationAnomalies,
        ...categoryAnomalies,
        ...temporalAnomalies
      ];

      // Sort by severity
      const severityScore = { critical: 0, high: 1, medium: 2, low: 3 };
      allAnomalies.sort((a, b) => severityScore[a.severity] - severityScore[b.severity]);

      // Anomaly score (0-100)
      const anomalyScore = this.calculateAnomalyScore(allAnomalies);

      return {
        success: true,
        itemId: item._id,
        itemName: item.name,
        category: item.category,
        anomalyScore,
        anomalyLevel: this.getAnomalyLevel(anomalyScore),
        anomalies: allAnomalies,
        count: allAnomalies.length,
        recommendation: this.getRecommendation(anomalyScore, allAnomalies)
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Detect anomalies across entire inventory
   */
  static async detectAllAnomalies(threshold = 'medium') {
    try {
      const items = await Item.find({ active: true });
      const severityScore = { critical: 0, high: 1, medium: 2, low: 3 };
      const thresholdScore = severityScore[threshold] !== undefined ? severityScore[threshold] : 2;

      const anomalyReports = [];

      for (const item of items) {
        const report = await this.detectAnomalies(item._id);
        
        if (report.success && report.anomalies.length > 0) {
          // Filter by threshold
          const filteredAnomalies = report.anomalies.filter(
            a => severityScore[a.severity] <= thresholdScore
          );

          if (filteredAnomalies.length > 0) {
            anomalyReports.push({
              itemId: item._id,
              itemName: item.name,
              category: item.category,
              anomalyScore: report.anomalyScore,
              anomalyLevel: report.anomalyLevel,
              anomalyCount: filteredAnomalies.length,
              topAnomalies: filteredAnomalies.slice(0, 3)
            });
          }
        }
      }

      // Sort by anomaly score (highest first)
      anomalyReports.sort((a, b) => b.anomalyScore - a.anomalyScore);

      return {
        success: true,
        totalItemsAnalyzed: items.length,
        anomalousItems: anomalyReports.length,
        threshold,
        data: anomalyReports,
        summary: this.generateAnomalySummary(anomalyReports)
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Calculate composite anomaly score (0-100)
   */
  static calculateAnomalyScore(anomalies) {
    if (anomalies.length === 0) return 0;

    const severityWeights = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3
    };

    let score = 0;
    anomalies.forEach(anomaly => {
      score += severityWeights[anomaly.severity] || 0;
    });

    return Math.min(100, score);
  }

  /**
   * Get anomaly severity level based on score
   */
  static getAnomalyLevel(score) {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    if (score >= 10) return 'LOW';
    return 'NORMAL';
  }

  /**
   * Get actionable recommendation based on anomalies
   */
  static getRecommendation(score, anomalies) {
    if (score >= 75) {
      return 'URGENT: Immediate investigation required. Possible fraudulent activity or system malfunction.';
    }
    if (score >= 50) {
      return 'WARNING: Multiple anomalies detected. Review item history and audit recent transactions.';
    }
    if (score >= 25) {
      return 'CAUTION: Some unusual patterns detected. Monitor this item closely in future transactions.';
    }
    if (score >= 10) {
      return 'INFO: Minor anomalies noted. No immediate action needed.';
    }
    return 'OK: Item shows normal usage patterns.';
  }

  /**
   * Generate summary statistics for anomaly report
   */
  static generateAnomalySummary(anomalyReports) {
    const summary = {
      totalAnomalousItems: anomalyReports.length,
      criticalItems: anomalyReports.filter(r => r.anomalyLevel === 'CRITICAL').length,
      highPriorityItems: anomalyReports.filter(r => r.anomalyLevel === 'HIGH').length,
      averageAnomalyScore: (
        anomalyReports.reduce((sum, r) => sum + r.anomalyScore, 0) / anomalyReports.length
      ).toFixed(2),
      topAnomalies: anomalyReports.slice(0, 5).map(r => ({
        name: r.itemName,
        score: r.anomalyScore,
        level: r.anomalyLevel
      }))
    };

    return summary;
  }

  /**
   * Get anomaly statistics for dashboard
   */
  static async getAnomalyStatistics() {
    try {
      const items = await Item.find({ active: true });
      const stats = {
        totalItems: items.length,
        anomalousItems: 0,
        byCategory: {},
        bySeverity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      };

      for (const item of items) {
        const report = await this.detectAnomalies(item._id);
        
        if (report.success && report.anomalies.length > 0) {
          stats.anomalousItems++;

          // Category breakdown
          if (!stats.byCategory[item.category]) {
            stats.byCategory[item.category] = 0;
          }
          stats.byCategory[item.category]++;

          // Severity breakdown
          report.anomalies.forEach(anomaly => {
            stats.bySeverity[anomaly.severity]++;
          });
        }
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = AnomalyDetector;
