import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const activityLogService = {
  // Get user activity logs with pagination and filters
  getUserActivityLogs: async (params = {}) => {
    console.log('activityLogService.getUserActivityLogs: Fetching activity logs with params:', params);
    try {
      const response = await api.get('/activity-logs', { params });
      console.log('activityLogService.getUserActivityLogs: Received response:', response.data);
      return response.data;
    } catch (error) {
      console.error('activityLogService.getUserActivityLogs: Error fetching activity logs:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get activity statistics
  getActivityStatistics: async (params = {}) => {
    console.log('activityLogService.getActivityStatistics: Fetching statistics with params:', params);
    try {
      const response = await api.get('/activity-logs/statistics', { params });
      console.log('activityLogService.getActivityStatistics: Received response:', response.data);
      return response.data;
    } catch (error) {
      console.error('activityLogService.getActivityStatistics: Error fetching statistics:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get account-specific activity logs
  getAccountActivityLogs: async (accountId, params = {}) => {
    console.log(`activityLogService.getAccountActivityLogs: Fetching logs for account ${accountId} with params:`, params);
    try {
      const response = await api.get(`/activity-logs/account/${accountId}`, { params });
      console.log('activityLogService.getAccountActivityLogs: Received response:', response.data);
      return response.data;
    } catch (error) {
      console.error('activityLogService.getAccountActivityLogs: Error fetching account activity logs:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get activity log by ID
  getActivityLogById: async (id) => {
    console.log(`activityLogService.getActivityLogById: Fetching activity log with ID: ${id}`);
    try {
      const response = await api.get(`/activity-logs/${id}`);
      console.log('activityLogService.getActivityLogById: Received response:', response.data);
      return response.data;
    } catch (error) {
      console.error('activityLogService.getActivityLogById: Error fetching activity log:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get recent activities (admin only)
  getRecentActivities: async (params = {}) => {
    console.log('activityLogService.getRecentActivities: Fetching recent activities with params:', params);
    try {
      const response = await api.get('/activity-logs/admin/recent', { params });
      console.log('activityLogService.getRecentActivities: Received response:', response.data);
      return response.data;
    } catch (error) {
      console.error('activityLogService.getRecentActivities: Error fetching recent activities:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get security events (admin only)
  getSecurityEvents: async (params = {}) => {
    console.log('activityLogService.getSecurityEvents: Fetching security events with params:', params);
    try {
      const response = await api.get('/activity-logs/admin/security', { params });
      console.log('activityLogService.getSecurityEvents: Received response:', response.data);
      return response.data;
    } catch (error) {
      console.error('activityLogService.getSecurityEvents: Error fetching security events:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default activityLogService;