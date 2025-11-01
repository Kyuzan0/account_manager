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

export const accountService = {
  // Get all accounts
  getAll: async (params = {}) => {
    console.log('accountService.getAll: Fetching all accounts with params:', params);
    try {
      const response = await api.get('/accounts', { params });
      console.log('accountService.getAll: Received response:', response.data);
      return response.data;
    } catch (error) {
      console.error('accountService.getAll: Error fetching accounts:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get account by ID
  getById: async (id) => {
    console.log(`accountService.getById: Fetching account with ID: ${id}`);
    try {
      const response = await api.get(`/accounts/${id}`);
      console.log('accountService.getById: Received response:', response.data);
      return response.data;
    } catch (error) {
      console.error('accountService.getById: Error fetching account:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create new account
  createAccount: async (accountData) => {
    const response = await api.post('/accounts', accountData);
    return response.data;
  },

  // Update account
  update: async (id, accountData) => {
    const response = await api.put(`/accounts/${id}`, accountData);
    return response.data;
  },

  // Delete account
  delete: async (id) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },

  // Alias for delete function for consistency
  deleteAccount: async (id) => {
    return await accountService.delete(id);
  },

  // Get account history
  getHistory: async (accountId) => {
    const response = await api.get(`/accounts/${accountId}/history`);
    return response.data;
  },

  // Generate password for account
  generatePassword: async (accountId, options = {}) => {
    const response = await api.post(`/accounts/${accountId}/generate-password`, options);
    return response.data;
  },

  // Check password strength
  checkPasswordStrength: async (password) => {
    const response = await api.post('/accounts/check-password-strength', { password });
    return response.data;
  },

  // Get security alerts
  getSecurityAlerts: async (accountId) => {
    const response = await api.get(`/accounts/${accountId}/security-alerts`);
    return response.data;
  },

  // Export accounts
  export: async (format = 'json') => {
    const response = await api.get(`/accounts/export?format=${format}`);
    return response.data;
  },

  // Import accounts
  import: async (fileData, format = 'json') => {
    const response = await api.post('/accounts/import', { data: fileData, format });
    return response.data;
  },

  // Get account statistics
  getStats: async () => {
    console.log('accountService: Fetching stats from /accounts/stats');
    try {
      const response = await api.get('/accounts/stats');
      console.log('accountService: Stats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('accountService: Error fetching stats:', error.response?.data || error.message);
      throw error;
    }
  },

  // Search accounts
  search: async (query, filters = {}) => {
    const response = await api.get('/accounts/search', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  // Bulk operations
  bulkCreate: async (accounts) => {
    const response = await api.post('/accounts/bulk', { accounts });
    return response.data;
  },

  bulkUpdate: async (updates) => {
    const response = await api.put('/accounts/bulk', { updates });
    return response.data;
  },

  bulkDelete: async (ids) => {
    console.log('accountService.bulkDelete: Deleting accounts with IDs:', ids);
    try {
      const response = await api.delete('/accounts/bulk', { data: { ids } });
      console.log('accountService.bulkDelete: Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('accountService.bulkDelete: Error deleting accounts:', error.response?.data || error.message);
      throw error;
    }
  },

  // Auto-create account with all data generated
  autoCreateAccount: async (platform, count = 1, options = {}) => {
    console.log('accountService.autoCreateAccount: Creating auto account with platform:', platform, 'count:', count, 'options:', options);
    try {
      const response = await api.post('/accounts/auto-create', {
        platform,
        count,
        options
      });
      console.log('accountService.autoCreateAccount: Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('accountService.autoCreateAccount: Error creating auto account:', error.response?.data || error.message);
      throw error;
    }
  },

  // Generate username only
  generateUsername: async (platform, options = {}) => {
    console.log('accountService.generateUsername: Generating username for platform:', platform, 'options:', options);
    try {
      const response = await api.get('/accounts/generate-username', {
        params: { platform, ...options }
      });
      console.log('accountService.generateUsername: Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('accountService.generateUsername: Error generating username:', error.response?.data || error.message);
      throw error;
    }
  },

  // Generate password only
  generateAutoPassword: async (platform, requirements = {}) => {
    console.log('accountService.generateAutoPassword: Generating password for platform:', platform, 'requirements:', requirements);
    try {
      const response = await api.get('/accounts/generate-password', {
        params: { platform, ...requirements }
      });
      console.log('accountService.generateAutoPassword: Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('accountService.generateAutoPassword: Error generating password:', error.response?.data || error.message);
      throw error;
    }
  },

  // Predict gender from name
  predictGender: async (name) => {
    console.log('accountService.predictGender: Predicting gender for name:', name);
    try {
      const response = await api.get('/accounts/predict-gender', {
        params: { name }
      });
      console.log('accountService.predictGender: Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('accountService.predictGender: Error predicting gender:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default accountService;