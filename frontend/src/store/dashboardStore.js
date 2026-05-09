import { create } from 'zustand';
import api from '@/services/api';

const useDashboardStore = create((set, get) => ({
  stats: null,
  analytics: null,
  aiInsights: null,
  activities: [],
  isLoading: false,
  error: null,

  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/analytics/dashboard');
      set({ stats: response.data.stats, isLoading: false, error: null });
      return { success: true, stats: response.data.stats };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch stats';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchAnalytics: async (period = '30d') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/analytics', { params: { period } });
      set({ analytics: response.data.analytics, isLoading: false, error: null });
      return { success: true, analytics: response.data.analytics };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch analytics';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchAIInsights: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/analytics/ai-insights');
      set({ aiInsights: response.data.insights, isLoading: false, error: null });
      return { success: true, insights: response.data.insights };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch AI insights';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchActivities: async (limit = 10) => {
    try {
      const response = await api.get('/analytics/activities', { params: { limit } });
      set({ activities: response.data.activities });
      return { success: true, activities: response.data.activities };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  clearError: () => set({ error: null })
}));

export default useDashboardStore;
