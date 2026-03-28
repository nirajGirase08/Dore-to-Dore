import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      // Create error with message from server
      const err = new Error(data.error || 'An error occurred');
      err.response = error.response;
      return Promise.reject(err);
    } else if (error.request) {
      // Request made but no response received
      const err = new Error('Backend server is not responding. Please make sure the server is running on http://localhost:5000');
      err.request = error.request;
      return Promise.reject(err);
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

// ============================================
// Authentication API
// ============================================

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ============================================
// Requests API (Developer 1)
// ============================================

export const requestsAPI = {
  create: async (requestData) => {
    const response = await api.post('/requests', requestData);
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get('/requests', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  getMy: async () => {
    const response = await api.get('/requests/my');
    return response.data;
  },

  update: async (id, requestData) => {
    const response = await api.put(`/requests/${id}`, requestData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/requests/${id}`);
    return response.data;
  },
};

// ============================================
// Offers API (Developer 1)
// ============================================

export const offersAPI = {
  create: async (offerData) => {
    const response = await api.post('/offers', offerData);
    return response.data;
  },

  getAll: async (params) => {
    const response = await api.get('/offers', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/offers/${id}`);
    return response.data;
  },

  getMy: async () => {
    const response = await api.get('/offers/my');
    return response.data;
  },

  update: async (id, offerData) => {
    const response = await api.put(`/offers/${id}`, offerData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/offers/${id}`);
    return response.data;
  },
};

// ============================================
// Search API (Developer 1)
// ============================================

export const searchAPI = {
  search: async (params) => {
    const response = await api.get('/search', { params });
    return response.data;
  },
};

// ============================================
// Messages API (Developer 1)
// ============================================

export const messagesAPI = {
  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },

  getMessages: async (conversationId) => {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (messageData) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  markAsRead: async (messageId) => {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  },
};

// ============================================
// Blockages API (Developer 2 will implement)
// ============================================

export const blockagesAPI = {
  // Developer 2: Add your blockage API methods here
  getAll: async (params) => {
    const response = await api.get('/blockages', { params });
    return response.data;
  },

  create: async (blockageData) => {
    const response = await api.post('/blockages', blockageData);
    return response.data;
  },
};

// ============================================
// Weather API (Developer 2 will implement)
// ============================================

export const weatherAPI = {
  // Developer 2: Add your weather API methods here
  getAlerts: async () => {
    const response = await api.get('/weather/alerts');
    return response.data;
  },
};

export default api;
