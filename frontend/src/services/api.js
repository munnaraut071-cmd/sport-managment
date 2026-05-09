import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Log API URL for debugging
console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Kits APIs
export const kitsAPI = {
  getAll: (params) => api.get('/kits', { params }),
  getById: (id) => api.get(`/kits/${id}`),
  create: (kitData) => api.post('/kits', kitData),
  update: (id, kitData) => api.put(`/kits/${id}`, kitData),
  delete: (id) => api.delete(`/kits/${id}`),
  issue: (id, data) => api.post(`/kits/${id}/issue`, data),
  return: (id, data) => api.post(`/kits/${id}/return`, data),
  getStats: () => api.get('/kits/stats'),
};

// Transactions APIs
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getStats: () => api.get('/transactions/stats'),
  export: (params) => api.get('/transactions/export', { params }),
  // Issue kit with proper field mapping
  issueKit: (data) => api.post('/transactions/issue', {
    kitId: data.kit,
    userId: data.userId || data.issuedTo, // Handle both formats
    dueDate: data.expectedReturnDate || data.dueDate,
    quantity: data.quantity || 1,
    notes: data.notes
  }),
  // Return kit
  returnKit: (data) => api.post('/transactions/return', {
    transactionId: data.transactionId || data.id,
    condition: data.condition || 'good',
    notes: data.notes
  }),
};

// Users APIs
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};

// Reservations APIs
export const reservationsAPI = {
  getAll: (params) => api.get('/reservations', { params }),
  getById: (id) => api.get(`/reservations/${id}`),
  create: (data) => api.post('/reservations', data),
  update: (id, data) => api.put(`/reservations/${id}`, data),
  delete: (id) => api.delete(`/reservations/${id}`),
  approve: (id) => api.put(`/reservations/${id}/approve`),
  reject: (id) => api.put(`/reservations/${id}/reject`),
};

// Analytics APIs
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getKitsUsage: (params) => api.get('/analytics/kits-usage', { params }),
  getTopSports: () => api.get('/analytics/top-sports'),
  getActivities: (params) => api.get('/analytics/activities', { params }),
  getLowStock: () => api.get('/analytics/low-stock'),
  getReports: (params) => api.get('/analytics/reports', { params }),
  generateReport: (data) => api.post('/analytics/reports', data),
};

// AI APIs
export const aiAPI = {
  getRecommendations: () => api.get('/ai/recommendations'),
  getPredictions: () => api.get('/ai/predictions'),
  getAnomalies: () => api.get('/ai/anomalies'),
  getInsights: () => api.get('/ai/insights'),
  analyzeUsage: (data) => api.post('/ai/analyze-usage', data),
};

// Calendar/Events APIs
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
  getUpcoming: () => api.get('/events/upcoming'),
};

// Notifications APIs
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAsUnread: (id) => api.put(`/notifications/${id}/unread`),
  archive: (id) => api.put(`/notifications/${id}/archive`),
  delete: (id) => api.delete(`/notifications/${id}`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (settings) => api.put('/notifications/settings', settings),
};

// Tournaments APIs
export const tournamentsAPI = {
  getAll: (params) => api.get('/tournaments', { params }),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
};

// Teams APIs
export const teamsAPI = {
  getAll: (params) => api.get('/teams', { params }),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
};

// Fines APIs
export const finesAPI = {
  getAll: (params) => api.get('/fines', { params }),
  getById: (id) => api.get(`/fines/${id}`),
  create: (data) => api.post('/fines', data),
  update: (id, data) => api.put(`/fines/${id}`, data),
  delete: (id) => api.delete(`/fines/${id}`),
  markPaid: (id) => api.put(`/fines/${id}/paid`),
};

// Chatbot APIs
export const chatbotAPI = {
  sendMessage: (message) => api.post('/chatbot/message', { message }),
  getHistory: () => api.get('/chatbot/history'),
};

// Audit APIs
export const auditAPI = {
  getLogs: (params) => api.get('/audit/logs', { params }),
  getStats: (days) => api.get(`/audit/stats?days=${days}`),
  getSuspicious: () => api.get('/audit/suspicious'),
  getUserLogs: (userId, params) => api.get(`/audit/user/${userId}`, { params }),
  getRecentAlerts: () => api.get('/audit/recent-alerts'),
};

// Security Alerts APIs
export const securityAPI = {
  getDashboard: () => api.get('/alerts/dashboard'),
  getRiskUsers: (params) => api.get('/alerts/risk-users', { params }),
  dismissAlert: (alertId) => api.post(`/alerts/dismiss/${alertId}`),
};

export { api };
export default api;
