import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', credentials);
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          
          return { success: true, user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          
          return { success: true, user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false 
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          error: null 
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }

        try {
          const response = await api.get('/auth/me');
          const user = response.data.user;
          set({ 
            user, 
            token,
            isAuthenticated: true,
            error: null 
          });
          return true;
        } catch (error) {
          localStorage.removeItem('token');
          set({ 
            user: null, 
            token: null,
            isAuthenticated: false,
            error: 'Session expired' 
          });
          return false;
        }
      },

      updateUser: async (userData) => {
        try {
          const response = await api.put(`/users/${get().user._id}`, userData);
          const updatedUser = response.data.user;
          set({ user: updatedUser });
          return { success: true, user: updatedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Update failed';
          return { success: false, error: errorMessage };
        }
      },

      clearError: () => set({ error: null }),

      // Computed properties
      isAdmin: () => get().user?.role === 'admin',
      isStaff: () => ['admin', 'staff'].includes(get().user?.role),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
