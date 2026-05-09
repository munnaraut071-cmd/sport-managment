import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

// Safe storage helper with fallback
const safeStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      try {
        return sessionStorage.getItem(key);
      } catch (e2) {
        console.warn('Storage not available:', e2);
        return null;
      }
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      try {
        sessionStorage.setItem(key, value);
      } catch (e2) {
        console.warn('Storage not available:', e2);
        // Fallback to in-memory
        safeStorage.memory = safeStorage.memory || {};
        safeStorage.memory[key] = value;
      }
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      try {
        sessionStorage.removeItem(key);
      } catch (e2) {
        console.warn('Storage not available:', e2);
        safeStorage.memory = safeStorage.memory || {};
        delete safeStorage.memory[key];
      }
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const token = safeStorage.getItem('authToken');
      const savedUser = safeStorage.getItem('user');
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        verifyToken();
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error('Auth init error:', e);
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await authAPI.me();
      setUser(response.data.user);
    } catch (error) {
      safeStorage.removeItem('authToken');
      safeStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    try {
      console.log('Calling authAPI.login with:', { email, password });
      const response = await authAPI.login({ email, password });
      console.log('authAPI.login response:', response);
      console.log('response.data:', response.data);
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        console.error('Missing token or user in response:', response.data);
        throw new Error('Invalid response from server');
      }
      
      safeStorage.setItem('authToken', token);
      safeStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${user.name}`,
        variant: 'success',
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      toast({
        title: 'Login failed',
        description: error.response?.data?.message || error.message || 'Invalid credentials',
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [toast]);

  const register = useCallback(async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      safeStorage.setItem('authToken', token);
      safeStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      toast({
        title: 'Account created!',
        description: 'Welcome to SPORTKITS',
        variant: 'success',
      });
      
      return { success: true, user };
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
      return { success: false, error: error.response?.data?.message };
    }
  }, [toast]);

  const logout = useCallback(() => {
    safeStorage.removeItem('authToken');
    safeStorage.removeItem('user');
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'See you soon!',
    });
  }, [toast]);

  const updateProfile = useCallback(async (userData) => {
    try {
      const response = await api.put(`/users/${user._id}`, userData);
      const updatedUser = response.data;
      safeStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast({
        title: 'Profile updated',
        variant: 'success',
      });
      return { success: true };
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
      return { success: false, error: error.response?.data?.message };
    }
  }, [user, toast]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff' || user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

