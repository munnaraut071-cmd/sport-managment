const Kit = require('../models/Kit');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { predictDemand } = require('./demandPrediction');
const { generateRecommendations } = require('./recommendation');

/**
 * AI Chatbot - Smart Assistant
 * Answers questions using database queries
 */

const chatbot = {
  /**
   * Process user query and return response
   */
  async processQuery(query, userId = null) {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Intent detection
    const intent = this.detectIntent(normalizedQuery);
    
    // Execute appropriate handler
    switch (intent.type) {
      case 'inventory_count':
        return await this.getInventoryCount();
      case 'available_kits':
        return await this.getAvailableKits(intent.category);
      case 'user_history':
        return await this.getUserHistory(userId);
      case 'overdue_items':
        return await this.getOverdueItems();
      case 'popular_kits':
        return await this.getPopularKits();
      case 'restock_needed':
        return await this.getRestockNeeded();
      case 'demand_prediction':
        return await this.getDemandPrediction();
      case 'kit_info':
        return await this.getKitInfo(intent.kitName);
      case 'user_stats':
        return await this.getUserStats(userId);
      case 'help':
        return this.getHelpResponse();
      default:
        return this.getDefaultResponse();
    }
  },

  /**
   * Detect intent from query
   */
  detectIntent(query) {
    const intents = [
      { type: 'inventory_count', patterns: ['how many kits', 'total kits', 'kit count', 'inventory size'] },
      { type: 'available_kits', patterns: ['what kits are available', 'available kits', 'can i get', 'show me kits', 'list kits'] },
      { type: 'user_history', patterns: ['my history', 'my issues', 'what have i borrowed', 'my transactions'] },
      { type: 'overdue_items', patterns: ['overdue', 'late returns', 'who has overdue', 'overdue kits'] },
      { type: 'popular_kits', patterns: ['popular kits', 'most used', 'top kits', 'which kits are used most'] },
      { type: 'restock_needed', patterns: ['restock', 'low stock', 'what to buy', 'purchase needed'] },
      { type: 'demand_prediction', patterns: ['demand', 'what will be needed', 'predict', 'forecast'] },
      { type: 'kit_info', patterns: ['tell me about', 'info on', 'details of', 'what is'] },
      { type: 'user_stats', patterns: ['my stats', 'my score', 'how am i doing', 'my risk'] },
      { type: 'help', patterns: ['help', 'what can you do', 'commands', 'how to use'] }
    ];

    // Check for category mentions
    const categories = ['cricket', 'football', 'badminton', 'basketball', 'tennis', 'hockey', 'volleyball', 'table tennis'];
    const mentionedCategory = categories.find(cat => query.includes(cat));

    for (const intent of intents) {
      if (intent.patterns.some(p => query.includes(p))) {
        return { 
          type: intent.type,
          category: mentionedCategory,
          kitName: this.extractKitName(query)
        };
      }
    }

    return { type: 'unknown' };
  },

  /**
   * Extract kit name from query
   */
  extractKitName(query) {
    // Simple extraction - look for words after "about", "info on", etc.
    const match = query.match(/(?:about|info on|details of|what is)\s+(.+)/);
    return match ? match[1].trim() : null;
  },

  /**
   * Get inventory count
   */
  async getInventoryCount() {
    const totalKits = await Kit.countDocuments();
    const activeKits = await Kit.countDocuments({ status: 'active' });
    const availableKits = await Kit.aggregate([
      { $group: { _id: null, total: { $sum: '$available' } } }
    ]);

    const totalAvailable = availableKits[0]?.total || 0;

    return {
      type: 'inventory_count',
      response: `We have ${totalKits} different kits in our inventory, with ${totalAvailable} total items available for issue. ${activeKits} kit types are currently active.`,
      data: { totalKits, activeKits, totalAvailable }
    };
  },

  /**
   * Get available kits
   */
  async getAvailableKits(category = null) {
    let query = { status: 'active', available: { $gt: 0 } };
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    const kits = await Kit.find(query).limit(10);
    
    if (kits.length === 0) {
      return {
        type: 'available_kits',
        response: category 
          ? `Sorry, no ${category} kits are currently available.`
          : 'No kits are currently available for issue.',
        data: { kits: [], count: 0 }
      };
    }

    const kitList = kits.map(k => `${k.name} (${k.available} available)`).join(', ');
    
    return {
      type: 'available_kits',
      response: category
        ? `Available ${category} kits: ${kitList}`
        : `Here are some available kits: ${kitList}. You can browse all kits in the Kits section.`,
      data: { kits, count: kits.length }
    };
  },

  /**
   * Get user's borrowing history
   */
  async getUserHistory(userId) {
    if (!userId) {
      return {
        type: 'user_history',
        response: 'Please log in to view your history.',
        data: null
      };
    }

    const transactions = await Transaction.find({ user: userId })
      .populate('kit', 'name category')
      .sort({ createdAt: -1 })
      .limit(10);

    const totalIssues = await Transaction.countDocuments({ user: userId, type: 'issue' });
    const activeLoans = await Transaction.countDocuments({ user: userId, type: 'issue', status: 'active' });

    if (transactions.length === 0) {
      return {
        type: 'user_history',
        response: "You haven't borrowed any kits yet. Browse our collection to get started!",
        data: { transactions: [], totalIssues: 0, activeLoans: 0 }
      };
    }

    const recentActivity = transactions.map(t => 
      `${t.type === 'issue' ? 'Borrowed' : 'Returned'} ${t.kit?.name} on ${new Date(t.createdAt).toDateString()}`
    ).join('\n');

    return {
      type: 'user_history',
      response: `Your recent activity:\n${recentActivity}\n\nTotal issues: ${totalIssues}, Currently borrowed: ${activeLoans}`,
      data: { transactions, totalIssues, activeLoans }
    };
  },

  /**
   * Get overdue items
   */
  async getOverdueItems() {
    const overdue = await Transaction.find({ status: 'overdue' })
      .populate('user', 'name email')
      .populate('kit', 'name category');

    const totalOverdue = overdue.length;

    if (totalOverdue === 0) {
      return {
        type: 'overdue_items',
        response: 'Great news! No kits are currently overdue.',
        data: { overdue: [], count: 0 }
      };
    }

    const overdueList = overdue.slice(0, 5).map(o => 
      `${o.kit?.name} borrowed by ${o.user?.name} - ${o.daysOverdue} days overdue`
    ).join('\n');

    return {
      type: 'overdue_items',
      response: `There are ${totalOverdue} overdue kits.\n\n${overdueList}\n${totalOverdue > 5 ? `...and ${totalOverdue - 5} more` : ''}`,
      data: { overdue, count: totalOverdue }
    };
  },

  /**
   * Get popular kits
   */
  async getPopularKits() {
    const popular = await Transaction.aggregate([
      { $match: { type: 'issue' } },
      { $group: { _id: '$kit', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'kits',
          localField: '_id',
          foreignField: '_id',
          as: 'kit'
        }
      },
      { $unwind: '$kit' }
    ]);

    if (popular.length === 0) {
      return {
        type: 'popular_kits',
        response: 'No borrowing data available yet.',
        data: { popular: [], count: 0 }
      };
    }

    const kitList = popular.map(p => `${p.kit.name} (${p.count} issues)`).join(', ');

    return {
      type: 'popular_kits',
      response: `Most popular kits: ${kitList}`,
      data: { popular, count: popular.length }
    };
  },

  /**
   * Get restock recommendations
   */
  async getRestockNeeded() {
    const recommendations = await generateRecommendations();
    const highPriority = recommendations.filter(r => r.priority === 'high');

    if (highPriority.length === 0) {
      return {
        type: 'restock_needed',
        response: 'No urgent restocking needed at the moment. All kits are well-stocked.',
        data: { recommendations: [], count: 0 }
      };
    }

    const restockList = highPriority.slice(0, 5).map(r => 
      `${r.kitName} - buy ${r.recommendedQty} units`
    ).join('\n');

    return {
      type: 'restock_needed',
      response: `High priority restock needed:\n${restockList}\n\nTotal urgent items: ${highPriority.length}`,
      data: { recommendations: highPriority, count: highPriority.length }
    };
  },

  /**
   * Get demand prediction
   */
  async getDemandPrediction() {
    const predictions = await predictDemand();
    const highDemand = predictions.filter(p => p.level === 'high');

    if (highDemand.length === 0) {
      return {
        type: 'demand_prediction',
        response: 'Demand is currently stable across all categories.',
        data: { predictions: [], count: 0 }
      };
    }

    const demandList = highDemand.slice(0, 5).map(p => 
      `${p.kitName} - predicted demand: ${p.predictedDemand} units`
    ).join('\n');

    return {
      type: 'demand_prediction',
      response: `High demand expected for:\n${demandList}\n\nTotal high-demand kits: ${highDemand.length}`,
      data: { predictions: highDemand, count: highDemand.length }
    };
  },

  /**
   * Get kit info
   */
  async getKitInfo(kitName) {
    if (!kitName) {
      return {
        type: 'kit_info',
        response: 'Please specify which kit you want to know about.',
        data: null
      };
    }

    const kit = await Kit.findOne({
      name: { $regex: kitName, $options: 'i' }
    });

    if (!kit) {
      return {
        type: 'kit_info',
        response: `I couldn't find a kit matching "${kitName}". Please check the name and try again.`,
        data: null
      };
    }

    const totalIssues = await Transaction.countDocuments({ kit: kit._id, type: 'issue' });

    return {
      type: 'kit_info',
      response: `${kit.name} (${kit.category}): ${kit.available} of ${kit.quantity} available. ${kit.description || ''} This kit has been issued ${totalIssues} times.`,
      data: { kit, totalIssues }
    };
  },

  /**
   * Get user stats
   */
  async getUserStats(userId) {
    if (!userId) {
      return {
        type: 'user_stats',
        response: 'Please log in to view your stats.',
        data: null
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        type: 'user_stats',
        response: 'User not found.',
        data: null
      };
    }

    const totalIssues = await Transaction.countDocuments({ user: userId, type: 'issue' });
    const activeLoans = await Transaction.countDocuments({ user: userId, type: 'issue', status: 'active' });
    const overdue = await Transaction.countDocuments({ user: userId, status: 'overdue' });

    let riskMessage = '';
    if (user.riskScore < 30) riskMessage = 'Excellent borrowing record!';
    else if (user.riskScore < 50) riskMessage = 'Good borrowing record.';
    else if (user.riskScore < 70) riskMessage = 'Some late returns detected.';
    else riskMessage = 'Please improve your return punctuality.';

    return {
      type: 'user_stats',
      response: `Your stats:\n• Total issues: ${totalIssues}\n• Active loans: ${activeLoans}\n• Overdue: ${overdue}\n• Risk score: ${user.riskScore}/100\n\n${riskMessage}`,
      data: {
        totalIssues,
        activeLoans,
        overdue,
        riskScore: user.riskScore,
        riskLevel: user.riskLevel
      }
    };
  },

  /**
   * Get help response
   */
  getHelpResponse() {
    return {
      type: 'help',
      response: `I can help you with:\n\n` +
        `📦 Inventory: "How many kits do we have?", "What kits are available?"\n` +
        `🔍 Kit Info: "Tell me about [kit name]"\n` +
        `📊 Stats: "Show popular kits", "What needs restock?"\n` +
        `📈 Predictions: "What will be in demand?"\n` +
        `📋 Your Data: "My history", "My stats"\n` +
        `⚠️ Alerts: "Any overdue items?"`,
      data: { commands: ['inventory', 'available', 'kit info', 'popular', 'restock', 'demand', 'my history', 'my stats', 'overdue', 'help'] }
    };
  },

  /**
   * Default response
   */
  getDefaultResponse() {
    return {
      type: 'unknown',
      response: "I'm not sure I understand. Try asking about:\n• Available kits\n• Kit information\n• Your borrowing history\n• Popular kits\n• What needs restocking\n\nOr type 'help' for more options.",
      data: null
    };
  }
};

module.exports = chatbot;
