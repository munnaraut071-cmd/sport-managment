const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Health check
const checkHealth = async () => {
  try {
    const response = await aiClient.get('/health');
    return response.data;
  } catch (error) {
    return { status: 'unavailable', error: error.message };
  }
};

// Forecast demand for a kit
const forecastDemand = async (kitData) => {
  try {
    const response = await aiClient.post('/forecast/demand', kitData);
    return response.data;
  } catch (error) {
    console.error('AI Service - forecastDemand error:', error.message);
    throw error;
  }
};

// Predict late return probability
const predictLateReturn = async (userData) => {
  try {
    const response = await aiClient.post('/predict/late-return', userData);
    return response.data;
  } catch (error) {
    console.error('AI Service - predictLateReturn error:', error.message);
    throw error;
  }
};

// Get restock recommendations
const getRestockRecommendations = async (recommendations) => {
  try {
    const response = await aiClient.post('/recommend/restock', recommendations);
    return response.data;
  } catch (error) {
    console.error('AI Service - getRestockRecommendations error:', error.message);
    throw error;
  }
};

// Get purchase recommendations
const getPurchaseRecommendations = async (purchaseData) => {
  try {
    const response = await aiClient.post('/recommend/purchases', purchaseData);
    return response.data;
  } catch (error) {
    console.error('AI Service - getPurchaseRecommendations error:', error.message);
    throw error;
  }
};

// Analyze usage patterns
const analyzeUsagePatterns = async (transactions) => {
  try {
    const response = await aiClient.post('/analyze/usage-patterns', transactions);
    return response.data;
  } catch (error) {
    console.error('AI Service - analyzeUsagePatterns error:', error.message);
    throw error;
  }
};

// Comprehensive AI analysis for dashboard
const getComprehensiveAnalysis = async (data) => {
  try {
    const [forecast, usageAnalysis] = await Promise.all([
      forecastDemand(data.forecastData).catch(() => null),
      analyzeUsagePatterns(data.transactions).catch(() => null)
    ]);

    return {
      forecast,
      usageAnalysis,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI Service - getComprehensiveAnalysis error:', error.message);
    return null;
  }
};

module.exports = {
  checkHealth,
  forecastDemand,
  predictLateReturn,
  getRestockRecommendations,
  getPurchaseRecommendations,
  analyzeUsagePatterns,
  getComprehensiveAnalysis,
  AI_SERVICE_URL
};
