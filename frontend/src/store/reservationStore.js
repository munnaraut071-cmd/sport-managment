import { create } from 'zustand';
import api from '@/services/api';

const useReservationStore = create((set, get) => ({
  reservations: [],
  myReservations: [],
  currentReservation: null,
  isLoading: false,
  error: null,
  filters: {
    status: '',
    kitId: '',
    startDate: '',
    endDate: '',
    priority: ''
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },

  fetchReservations: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { filters, pagination } = get();
      const queryParams = { ...filters, page: pagination.page, limit: pagination.limit, ...params };
      
      const response = await api.get('/reservations', { params: queryParams });
      const { reservations, pagination: pag } = response.data;
      
      set({ reservations, pagination: pag, isLoading: false, error: null });
      return { success: true, reservations, pagination: pag };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch reservations';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchMyReservations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/reservations/my-reservations');
      set({ myReservations: response.data.reservations, isLoading: false, error: null });
      return { success: true, reservations: response.data.reservations };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch reservations';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  createReservation: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/reservations', data);
      const reservation = response.data.reservation;
      set(state => ({ 
        reservations: [reservation, ...state.reservations],
        myReservations: [reservation, ...state.myReservations],
        isLoading: false, 
        error: null 
      }));
      return { success: true, reservation };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create reservation';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  approveReservation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/reservations/${id}/approve`);
      const reservation = response.data.reservation;
      set(state => ({
        reservations: state.reservations.map(r => r._id === id ? reservation : r),
        isLoading: false,
        error: null
      }));
      return { success: true, reservation };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to approve reservation';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  rejectReservation: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/reservations/${id}/reject`, { reason });
      const reservation = response.data.reservation;
      set(state => ({
        reservations: state.reservations.map(r => r._id === id ? reservation : r),
        isLoading: false,
        error: null
      }));
      return { success: true, reservation };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reject reservation';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  cancelReservation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/reservations/${id}/cancel`);
      const reservation = response.data.reservation;
      set(state => ({
        reservations: state.reservations.map(r => r._id === id ? reservation : r),
        myReservations: state.myReservations.map(r => r._id === id ? reservation : r),
        isLoading: false,
        error: null
      }));
      return { success: true, reservation };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel reservation';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  setFilters: (filters) => set(state => ({ 
    filters: { ...state.filters, ...filters },
    pagination: { ...state.pagination, page: 1 }
  })),

  setPage: (page) => set(state => ({ pagination: { ...state.pagination, page } })),
  clearError: () => set({ error: null })
}));

export default useReservationStore;
