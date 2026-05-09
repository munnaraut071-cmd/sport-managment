import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { authAPI, usersAPI, type User, type LoginCredentials, type RegisterData } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Hook
export function useAuthProvider(): AuthContextType {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isStaff: false,
    loading: true,
    error: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const response = await authAPI.me();
          const user = response.data.data;
          
          setState({
            user,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isStaff: user.role === 'staff' || user.role === 'admin',
            loading: false,
            error: null,
          });
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setState(prev => ({ ...prev, loading: false }));
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setState({
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        isStaff: user.role === 'staff' || user.role === 'admin',
        loading: false,
        error: null,
      });
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await authAPI.register(data);
      const { token, user } = response.data.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setState({
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        isStaff: user.role === 'staff' || user.role === 'admin',
        loading: false,
        error: null,
      });
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    // Call logout API (optional - can be fire-and-forget)
    authAPI.logout().catch(() => {});
    
    // Clear storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isStaff: false,
      loading: false,
      error: null,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.me();
      const user = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      
      setState(prev => ({
        ...prev,
        user,
        isAdmin: user.role === 'admin',
        isStaff: user.role === 'staff' || user.role === 'admin',
      }));
    } catch (error) {
      // If refresh fails, logout
      logout();
    }
  }, [logout]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      if (!state.user?._id) {
        return { success: false, error: 'Not authenticated' };
      }
      
      const response = await usersAPI.update(state.user._id, data);
      const updatedUser = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Update failed';
      return { success: false, error: errorMessage };
    }
  }, [state.user?._id]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    clearError,
  };
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
export default useAuth;
