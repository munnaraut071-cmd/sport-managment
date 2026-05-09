import { create } from 'zustand';
import api from '@/services/api';

const useKitStore = create((set, get) => ({
  // State
  kits: [],
  currentKit: null,
  categories: [],
  stats: null,
  isLoading: false,
  error: null,
  filters: {
    category: '',
    status: '',
    search: '',
    sortBy: 'createdAt',
    order: 'desc'
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },

  // Actions
  fetchKits: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { filters, pagination } = get();
      const queryParams = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        ...params
      };
      
      const response = await api.get('/kits', { params: queryParams });
      const { kits, pagination: pag } = response.data;
      
      set({ 
        kits, 
        pagination: pag,
        isLoading: false,
        error: null 
      });
      
      return { success: true, kits, pagination: pag };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch kits';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchKitById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/kits/${id}`);
      const kit = response.data.kit;
      set({ currentKit: kit, isLoading: false, error: null });
      return { success: true, kit };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch kit';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  createKit: async (kitData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/kits', kitData);
      const newKit = response.data.kit;
      set(state => ({ 
        kits: [newKit, ...state.kits],
        isLoading: false,
        error: null 
      }));
      return { success: true, kit: newKit };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create kit';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  updateKit: async (id, kitData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/kits/${id}`, kitData);
      const updatedKit = response.data.kit;
      set(state => ({
        kits: state.kits.map(k => k._id === id ? updatedKit : k),
        currentKit: state.currentKit?._id === id ? updatedKit : state.currentKit,
        isLoading: false,
        error: null
      }));
      return { success: true, kit: updatedKit };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update kit';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  deleteKit: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/kits/${id}`);
      set(state => ({
        kits: state.kits.filter(k => k._id !== id),
        isLoading: false,
        error: null
      }));
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete kit';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  issueKit: async (kitId, issueData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/kits/${kitId}/issue`, issueData);
      const { kit, transaction } = response.data;
      set(state => ({
        kits: state.kits.map(k => k._id === kitId ? kit : k),
        currentKit: state.currentKit?._id === kitId ? kit : state.currentKit,
        isLoading: false,
        error: null
      }));
      return { success: true, kit, transaction };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to issue kit';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  returnKit: async (kitId, returnData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/kits/${kitId}/return`, returnData);
      const { kit, transaction } = response.data;
      set(state => ({
        kits: state.kits.map(k => k._id === kitId ? kit : k),
        currentKit: state.currentKit?._id === kitId ? kit : state.currentKit,
        isLoading: false,
        error: null
      }));
      return { success: true, kit, transaction };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to return kit';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchCategories: async () => {
    try {
      const response = await api.get('/kits/categories');
      set({ categories: response.data.categories });
      return { success: true, categories: response.data.categories };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  fetchStats: async () => {
    try {
      const response = await api.get('/kits/stats');
      set({ stats: response.data.stats });
      return { success: true, stats: response.data.stats };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  setFilters: (filters) => {
    set(state => ({ 
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        category: '',
        status: '',
        search: '',
        sortBy: 'createdAt',
        order: 'desc'
      },
      pagination: { ...get().pagination, page: 1 }
    });
  },

  setPage: (page) => {
    set(state => ({ pagination: { ...state.pagination, page } }));
  },

  clearError: () => set({ error: null }),
  clearCurrentKit: () => set({ currentKit: null }),

  // Computed
  getLowStockKits: () => {
    return get().kits.filter(k => k.available <= 5 && k.status === 'active');
  },

  getAvailableKits: () => {
    return get().kits.filter(k => k.available > 0 && k.status === 'active');
  }
}));

export default useKitStore;
