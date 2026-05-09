import { create } from 'zustand';
import api from '@/services/api';

const useTransactionStore = create((set, get) => ({
  // State
  transactions: [],
  currentTransaction: null,
  myTransactions: [],
  overdueTransactions: [],
  stats: null,
  isLoading: false,
  error: null,
  filters: {
    status: '',
    kitId: '',
    userId: '',
    startDate: '',
    endDate: '',
    isOverdue: ''
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },

  // Actions
  fetchTransactions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { filters, pagination } = get();
      const queryParams = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        ...params
      };
      
      const response = await api.get('/transactions', { params: queryParams });
      const { transactions, pagination: pag } = response.data;
      
      set({ 
        transactions, 
        pagination: pag,
        isLoading: false,
        error: null 
      });
      
      return { success: true, transactions, pagination: pag };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch transactions';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchMyTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/transactions/my-transactions');
      set({ 
        myTransactions: response.data.transactions,
        isLoading: false,
        error: null 
      });
      return { success: true, transactions: response.data.transactions };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch your transactions';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchOverdueTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/transactions/overdue');
      set({ 
        overdueTransactions: response.data.transactions,
        isLoading: false,
        error: null 
      });
      return { success: true, transactions: response.data.transactions };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch overdue transactions';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchTransactionById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/transactions/${id}`);
      const transaction = response.data.transaction;
      set({ currentTransaction: transaction, isLoading: false, error: null });
      return { success: true, transaction };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch transaction';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  issueKit: async (kitId, issueData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/transactions/issue`, { kitId, ...issueData });
      const transaction = response.data.transaction;
      set(state => ({ 
        transactions: [transaction, ...state.transactions],
        isLoading: false,
        error: null 
      }));
      return { success: true, transaction };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to issue kit';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  returnKit: async (transactionId, returnData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/transactions/${transactionId}/return`, returnData);
      const transaction = response.data.transaction;
      set(state => ({
        transactions: state.transactions.map(t => t._id === transactionId ? transaction : t),
        currentTransaction: state.currentTransaction?._id === transactionId ? transaction : state.currentTransaction,
        isLoading: false,
        error: null
      }));
      return { success: true, transaction };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to return kit';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  renewTransaction: async (transactionId, newDueDate) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/transactions/${transactionId}/renew`, { newDueDate });
      const transaction = response.data.transaction;
      set(state => ({
        transactions: state.transactions.map(t => t._id === transactionId ? transaction : t),
        currentTransaction: state.currentTransaction?._id === transactionId ? transaction : state.currentTransaction,
        isLoading: false,
        error: null
      }));
      return { success: true, transaction };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to renew';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchStats: async () => {
    try {
      const response = await api.get('/transactions/stats');
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
        status: '',
        kitId: '',
        userId: '',
        startDate: '',
        endDate: '',
        isOverdue: ''
      },
      pagination: { ...get().pagination, page: 1 }
    });
  },

  setPage: (page) => {
    set(state => ({ pagination: { ...state.pagination, page } }));
  },

  clearError: () => set({ error: null }),
  clearCurrentTransaction: () => set({ currentTransaction: null }),

  // Computed
  getActiveLoans: () => {
    return get().myTransactions.filter(t => t.status === 'active');
  },

  getOverdueCount: () => {
    return get().overdueTransactions.length;
  }
}));

export default useTransactionStore;
