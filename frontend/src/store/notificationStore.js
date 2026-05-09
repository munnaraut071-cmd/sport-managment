import { create } from 'zustand';
import api from '@/services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/notifications');
      set({ 
        notifications: response.data.notifications,
        unreadCount: response.data.notifications.filter(n => !n.read).length,
        isLoading: false,
        error: null 
      });
      return { success: true, notifications: response.data.notifications };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch notifications';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  markAsRead: async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      set(state => ({
        notifications: state.notifications.map(n => 
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/mark-all-read');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
  clearError: () => set({ error: null })
}));

export default useNotificationStore;
