const Item = require('../models/Item');

class AIPredictor {
  // Academic calendar with seasonal demand multipliers
  static academicCalendar = {
    'Jan-Feb': 1.8,    // Winter sports tournaments
    'Mar-Apr': 2.0,    // Spring tournaments and cricket season
    'May-Jun': 2.2,    // Summer peak, exams + sports
    'Jul-Aug': 1.5,    // Mid-year, vacation season
    'Sep-Oct': 2.3,    // New academic year, back to sports
    'Nov-Dec': 1.9     // Year-end tournaments
  };

  // Category base demand
  static categoryBaseDemand = {
    'Cricket': 8,
    'Football': 6,
    'Badminton': 5,
    'Basketball': 7,
    'Volleyball': 6,
    'Tennis': 4,
    'Hockey': 3,
    'Other': 2
  };

  /**
   * Get current season multiplier based on month
   */
  static getCurrentSeasonMultiplier() {
    const month = new Date().getMonth() + 1;
    
    if (month >= 1 && month <= 2) return this.academicCalendar['Jan-Feb'];
    if (month >= 3 && month <= 4) return this.academicCalendar['Mar-Apr'];
    if (month >= 5 && month <= 6) return this.academicCalendar['May-Jun'];
    if (month >= 7 && month <= 8) return this.academicCalendar['Jul-Aug'];
    if (month >= 9 && month <= 10) return this.academicCalendar['Sep-Oct'];
    if (month >= 11 && month <= 12) return this.academicCalendar['Nov-Dec'];
  }

  /**
   * Predict demand for a single item
   */
  static predictItemDemand(item) {
    if (!item.baseDemand) {
      item.baseDemand = this.categoryBaseDemand[item.category] || 5;
    }

    const seasonMultiplier = this.getCurrentSeasonMultiplier();
    const issuedFactor = Math.max(1, item.issued / 10); // Higher issued = higher demand
    const availableFactor = Math.max(0.5, (item.quantity - item.issued) / item.quantity);

    // Calculate predicted demand
    const predictedDemand = Math.round(
      item.baseDemand * seasonMultiplier * availableFactor * (1 + (issuedFactor * 0.1))
    );

    return Math.max(Math.ceil(predictedDemand), item.baseDemand);
  }

  /**
   * Predict demand for all items
   */
  static async predictAllDemands() {
    try {
      const items = await Item.find({ active: true });
      
      const predictions = items.map(item => ({
        id: item._id,
        name: item.name,
        category: item.category,
        currentDemand: item.baseDemand || 0,
        predictedDemand: this.predictItemDemand(item),
        urgency: this.getUrgencyLevel(item)
      }));

      return predictions;
    } catch (error) {
      console.error('Error predicting demands:', error);
      return [];
    }
  }

  /**
   * Get urgency level for reordering
   */
  static getUrgencyLevel(item) {
    const available = item.quantity - item.issued;
    const availabilityPercent = (available / item.quantity) * 100;

    if (availabilityPercent < 10) return 'critical';
    if (availabilityPercent < 30) return 'high';
    if (availabilityPercent < 60) return 'medium';
    return 'low';
  }

  /**
   * Get trending items (most issued recently)
   */
  static async getTrendingItems(limit = 5) {
    try {
      const items = await Item.find({ active: true })
        .sort({ issued: -1 })
        .limit(limit);

      return items.map(item => ({
        id: item._id,
        name: item.name,
        category: item.category,
        issued: item.issued,
        trendingScore: this.calculateTrendingScore(item)
      }));
    } catch (error) {
      console.error('Error getting trending items:', error);
      return [];
    }
  }

  /**
   * Calculate trending score (0-100)
   */
  static calculateTrendingScore(item) {
    const issuedScore = Math.min(100, (item.issued / 50) * 100); // 50 issues = 100 score
    const damageScore = Math.min(50, (item.damaged / 10) * 100); // 10 damages = 50 points
    const returnScore = Math.min(50, (item.returned / 20) * 100); // 20 returns = 50 points

    return Math.round(issuedScore + (damageScore * 0.2) + (returnScore * 0.1));
  }

  /**
   * Get reorder recommendations
   */
  static async getReorderRecommendations() {
    try {
      const items = await Item.find({ active: true });
      
      const recommendations = items
        .filter(item => {
          const available = item.quantity - item.issued;
          return available <= item.reorderLevel;
        })
        .map(item => ({
          id: item._id,
          name: item.name,
          category: item.category,
          currentStock: item.quantity - item.issued,
          reorderLevel: item.reorderLevel,
          recommendedQuantity: Math.round((item.baseDemand || 10) * 3),
          urgency: this.getUrgencyLevel(item),
          supplier: item.supplier
        }))
        .sort((a, b) => {
          const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        });

      return recommendations;
    } catch (error) {
      console.error('Error getting reorder recommendations:', error);
      return [];
    }
  }

  /**
   * Get inventory analytics
   */
  static async getInventoryAnalytics() {
    try {
      const items = await Item.find({ active: true });

      const analytics = {
        totalItems: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        totalIssued: items.reduce((sum, item) => sum + item.issued, 0),
        totalDamaged: items.reduce((sum, item) => sum + item.damaged, 0),
        totalLost: items.reduce((sum, item) => sum + item.lost, 0),
        totalValue: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        averageStock: Math.round(items.reduce((sum, item) => sum + (item.quantity - item.issued), 0) / items.length),
        criticalItems: items.filter(item => this.getUrgencyLevel(item) === 'critical').length,
        highUrgencyItems: items.filter(item => this.getUrgencyLevel(item) === 'high').length,
        categoryBreakdown: this.getCategoryBreakdown(items)
      };

      return analytics;
    } catch (error) {
      console.error('Error getting inventory analytics:', error);
      return null;
    }
  }

  /**
   * Get breakdown by category
   */
  static getCategoryBreakdown(items) {
    const breakdown = {};
    
    items.forEach(item => {
      if (!breakdown[item.category]) {
        breakdown[item.category] = {
          count: 0,
          quantity: 0,
          issued: 0,
          damaged: 0,
          value: 0
        };
      }
      
      breakdown[item.category].count++;
      breakdown[item.category].quantity += item.quantity;
      breakdown[item.category].issued += item.issued;
      breakdown[item.category].damaged += item.damaged;
      breakdown[item.category].value += item.quantity * item.unitPrice;
    });

    return breakdown;
  }

  /**
   * Get smart reminders for returns
   */
  static async getSmartReminders() {
    try {
      const items = await Item.find({ issued: { $gt: 0 } });

      const reminders = [];

      items.forEach(item => {
        if (item.issued > 10) {
          reminders.push({
            type: 'high_issued',
            message: `${item.name} has ${item.issued} units issued. Consider follow-up for returns.`,
            severity: 'high',
            itemId: item._id,
            itemName: item.name
          });
        }

        if (item.damaged > 0) {
          reminders.push({
            type: 'damaged_items',
            message: `${item.name} has ${item.damaged} damaged units. Arrange for replacement.`,
            severity: 'medium',
            itemId: item._id,
            itemName: item.name
          });
        }

        if (item.lost > 0) {
          reminders.push({
            type: 'lost_items',
            message: `${item.name} has ${item.lost} lost units. Update insurance/liability records.`,
            severity: 'high',
            itemId: item._id,
            itemName: item.name
          });
        }
      });

      return reminders.sort((a, b) => 
        ['high', 'medium', 'low'].indexOf(a.severity) - ['high', 'medium', 'low'].indexOf(b.severity)
      );
    } catch (error) {
      console.error('Error getting smart reminders:', error);
      return [];
    }
  }

  /**
   * Predict future demand for next N months
   */
  static async predictFutureDemand(months = 3) {
    try {
      const predictions = [];
      const currentMonth = new Date().getMonth() + 1;

      for (let i = 0; i < months; i++) {
        const futureMonth = ((currentMonth + i - 1) % 12) + 1;
        const monthName = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ][futureMonth - 1];

        // Get multiplier for this month
        let multiplier = 1;
        if (futureMonth >= 1 && futureMonth <= 2) multiplier = this.academicCalendar['Jan-Feb'];
        else if (futureMonth >= 3 && futureMonth <= 4) multiplier = this.academicCalendar['Mar-Apr'];
        else if (futureMonth >= 5 && futureMonth <= 6) multiplier = this.academicCalendar['May-Jun'];
        else if (futureMonth >= 7 && futureMonth <= 8) multiplier = this.academicCalendar['Jul-Aug'];
        else if (futureMonth >= 9 && futureMonth <= 10) multiplier = this.academicCalendar['Sep-Oct'];
        else if (futureMonth >= 11 && futureMonth <= 12) multiplier = this.academicCalendar['Nov-Dec'];

        const items = await Item.find({ active: true });
        const monthPrediction = {
          month: monthName,
          monthNumber: futureMonth,
          seasonMultiplier: multiplier,
          estimatedDemand: Math.round(
            items.reduce((sum, item) => sum + (item.baseDemand || 5), 0) * multiplier
          ),
          criticalItems: items.filter(item => item.quantity - item.issued <= item.reorderLevel).length
        };

        predictions.push(monthPrediction);
      }

      return predictions;
    } catch (error) {
      console.error('Error predicting future demand:', error);
      return [];
    }
  }
}

module.exports = AIPredictor;
