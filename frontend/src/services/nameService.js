import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('DEBUG: API URL:', API_URL);

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

export const nameService = {
  // Get all names
  getAll: async (page = 1, limit = 10, platform) => {
    console.log('DEBUG: getAll called with params:', { page, limit, platform });
    const params = { page, limit };
    if (platform) {
      params.platform = platform;
    }
    const response = await api.get('/names', { params });
    console.log('DEBUG: getAll response:', response.data);
    return response.data;
  },

  // Get name by ID
  getById: async (id) => {
    const response = await api.get(`/names/${id}`);
    return response.data;
  },

  // Create new name
  create: async (nameData) => {
    const response = await api.post('/names', nameData);
    return response.data;
  },

  // Update name
  update: async (id, nameData) => {
    const response = await api.put(`/names/${id}`, nameData);
    return response.data;
  },

  // Delete name
  delete: async (id) => {
    console.log('DEBUG: Deleting name with ID:', id);
    try {
      const response = await api.delete(`/names/${id}`);
      console.log('DEBUG: Delete response:', response.data);
      return response.data;
    } catch (error) {
      console.log('DEBUG: Delete error:', error);
      throw error;
    }
  },

  // Generate username
  generateUsername: async (options = {}) => {
    const response = await api.post('/names/generate', options);
    return response.data;
  },

  // Generate multiple usernames
  generateMultipleUsernames: async (options = {}) => {
    const response = await api.post('/names/generate-multiple', options);
    return response.data;
  },

  // Check username availability
  checkAvailability: async (username, platform) => {
    const response = await api.post('/names/check-availability', { username, platform });
    return response.data;
  },

  // Get username suggestions
  getSuggestions: async (baseName, platform, count = 5) => {
    const response = await api.post('/names/suggestions', { baseName, platform, count });
    return response.data;
  },

  // Get name categories
  getCategories: async () => {
    const response = await api.get('/names/categories');
    return response.data;
  },

  // Get name statistics
  getStats: async () => {
    const response = await api.get('/names/stats');
    return response.data;
  },

  // Search names
  search: async (query, filters = {}) => {
    const response = await api.get('/names/search', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  // Export names
  export: async (format = 'json') => {
    const response = await api.get(`/names/export?format=${format}`);
    return response.data;
  },

  // Import names
  import: async (fileData, format = 'json') => {
    const response = await api.post('/names/import', { data: fileData, format });
    return response.data;
  },

  // Bulk operations
  bulkCreate: async (names) => {
    const response = await api.post('/names/bulk', { names });
    return response.data;
  },

  bulkUpdate: async (updates) => {
    const response = await api.put('/names/bulk', { updates });
    return response.data;
  },

  bulkDelete: async (ids) => {
    const response = await api.delete('/names/bulk', { data: { ids } });
    return response.data;
  },

  // Get name history
  getHistory: async (nameId) => {
    const response = await api.get(`/names/${nameId}/history`);
    return response.data;
  },

  // Add to favorites
  addToFavorites: async (nameId) => {
    const response = await api.post(`/names/${nameId}/favorite`);
    return response.data;
  },

  // Remove from favorites
  removeFromFavorites: async (nameId) => {
    const response = await api.delete(`/names/${nameId}/favorite`);
    return response.data;
  },

  // Get favorite names
  getFavorites: async () => {
    const response = await api.get('/names/favorites');
    return response.data;
  },

  // Upload names from file
  uploadNames: async (formData) => {
    console.log('DEBUG: uploadNames called with formData:', formData);
    
    // Get auth token
    const token = localStorage.getItem('token');
    console.log('DEBUG: Auth token from localStorage:', token ? 'Token exists' : 'No token found');
    
    // Create headers for file upload
    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('DEBUG: Making upload request to:', `${API_URL}/names/upload`);
    console.log('DEBUG: Request headers:', headers);
    
    try {
      const response = await axios.post(`${API_URL}/names/upload`, formData, { headers });
      console.log('DEBUG: Upload response:', response);
      return response.data;
    } catch (error) {
      console.log('DEBUG: Upload error in service:', error);
      console.log('DEBUG: Error response status:', error.response?.status);
      console.log('DEBUG: Error response data:', error.response?.data);
      throw error;
    }
  },

  // Get random name for username generation
  getRandomName: async (platform) => {
    console.log('DEBUG: getRandomName called with platform:', platform);
    try {
      const response = await api.get(`/names/random/${platform}`);
      console.log('DEBUG: getRandomName response:', response.data);
      return response.data;
    } catch (error) {
      console.log('DEBUG: getRandomName error:', error);
      console.log('DEBUG: Error response status:', error.response?.status);
      console.log('DEBUG: Error response data:', error.response?.data);
      
      // If no names found, try to create a default one
      if (error.response?.status === 404) {
        console.log('DEBUG: No names found, creating default username');
        const defaultUsername = `user${Date.now()}`;
        console.log('DEBUG: Created default username:', defaultUsername);
        return { name: defaultUsername };
      }
      
      throw error;
    }
  }
};

export default nameService;