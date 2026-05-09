const express = require('express');
const router = express.Router();
const chatbot = require('../ai/chatbot');
const { protect } = require('../middleware/auth');

// @route   POST /api/chatbot/query
// @desc    Process chatbot query
// @access  Private
router.post('/query', protect, async (req, res, next) => {
  try {
    const { query, sessionId } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Query is required' 
      });
    }
    
    // Process the query
    const response = await chatbot.processQuery(query, req.user.id);
    
    // Store chat history (optional - for future reference)
    // await ChatHistory.create({
    //   user: req.user.id,
    //   sessionId,
    //   query,
    //   response: response.response,
    //   intent: response.type
    // });
    
    res.json({
      success: true,
      data: {
        query,
        response: response.response,
        intent: response.type,
        data: response.data,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process query',
      error: error.message
    });
  }
});

// @route   GET /api/chatbot/suggestions
// @desc    Get suggested queries
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  const suggestions = [
    { query: 'How many kits do we have?', category: 'inventory' },
    { query: 'What kits are available?', category: 'inventory' },
    { query: 'Show me available football kits', category: 'inventory' },
    { query: 'What is my borrowing history?', category: 'personal' },
    { query: 'What are my stats?', category: 'personal' },
    { query: 'Any overdue items?', category: 'admin' },
    { query: 'What kits are most popular?', category: 'analytics' },
    { query: 'What needs restock?', category: 'admin' },
    { query: 'What will be in demand?', category: 'ai' },
    { query: 'Tell me about cricket bat', category: 'info' },
    { query: 'Help', category: 'help' }
  ];
  
  // Filter based on user role
  let filtered = suggestions;
  if (req.user.role !== 'admin') {
    filtered = suggestions.filter(s => 
      s.category !== 'admin' || s.query.includes('overdue items')
    );
  }
  
  res.json({
    success: true,
    data: filtered
  });
});

// @route   GET /api/chatbot/intents
// @desc    Get available intents (for documentation)
// @access  Private
router.get('/intents', protect, (req, res) => {
  const intents = [
    {
      type: 'inventory_count',
      description: 'Get total number of kits',
      examples: ['how many kits', 'total kits', 'inventory size']
    },
    {
      type: 'available_kits',
      description: 'List available kits for issue',
      examples: ['what kits are available', 'available kits', 'show me kits']
    },
    {
      type: 'user_history',
      description: 'Get user borrowing history',
      examples: ['my history', 'my issues', 'what have i borrowed']
    },
    {
      type: 'overdue_items',
      description: 'Get list of overdue items',
      examples: ['overdue', 'late returns', 'who has overdue']
    },
    {
      type: 'popular_kits',
      description: 'Get most popular/used kits',
      examples: ['popular kits', 'most used', 'top kits']
    },
    {
      type: 'restock_needed',
      description: 'Get kits that need restocking',
      examples: ['restock', 'low stock', 'what to buy']
    },
    {
      type: 'demand_prediction',
      description: 'Get AI demand predictions',
      examples: ['demand', 'what will be needed', 'predict']
    },
    {
      type: 'kit_info',
      description: 'Get information about a specific kit',
      examples: ['tell me about [kit]', 'info on [kit]', 'details of [kit]']
    },
    {
      type: 'user_stats',
      description: 'Get user statistics and risk score',
      examples: ['my stats', 'my score', 'how am i doing']
    },
    {
      type: 'help',
      description: 'Get help and available commands',
      examples: ['help', 'what can you do', 'commands']
    }
  ];
  
  res.json({
    success: true,
    data: intents
  });
});

module.exports = router;
