import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
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
      const err = new Error('Backend server is not responding. Please make sure the server is running on http://localhost:5001');
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

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};

const fileToBase64Payload = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => {
    const result = reader.result;
    const base64Data = typeof result === 'string' ? result.split(',')[1] : null;

    if (!base64Data) {
      reject(new Error('Failed to read image file.'));
      return;
    }

    resolve({
      base64Data,
      mimeType: file.type,
      fileName: file.name,
    });
  };

  reader.onerror = () => reject(new Error('Failed to read image file.'));
  reader.readAsDataURL(file);
});

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

  updateStatus: async (id, status) => {
    const response = await api.patch(`/requests/${id}/status`, { status });
    return response.data;
  },

  fulfillItem: async (requestId, itemId, payload = {}) => {
    const response = await api.patch(`/requests/${requestId}/items/${itemId}/fulfill`, payload);
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

  updateStatus: async (id, status) => {
    const response = await api.patch(`/offers/${id}/status`, { status });
    return response.data;
  },

  fulfillItem: async (offerId, itemId, payload = {}) => {
    const response = await api.patch(`/offers/${offerId}/items/${itemId}/fulfill`, payload);
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
// Messages & Conversations API (Developer 1)
// ============================================

export const conversationsAPI = {
  // Get all conversations for current user
  getAll: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },

  // Get single conversation with all messages
  getById: async (conversationId) => {
    const response = await api.get(`/conversations/${conversationId}`);
    return response.data;
  },

  // Create or get existing conversation with another user
  createOrGet: async (otherUserId, initialMessage = null, offerId = null, requestId = null) => {
    const payload = {
      other_user_id: otherUserId,
      initial_message: initialMessage,
      offer_id: offerId,
      request_id: requestId
    };
    console.log('Creating/getting conversation with payload:', payload);
    const response = await api.post('/conversations', payload);
    console.log('Conversation API response:', response.data);
    return response.data;
  },

  // Get unread message count for current user
  getUnreadCount: async () => {
    const response = await api.get('/conversations/unread-count');
    return response.data;
  },

  getRelatedOptions: async ({ requestId = null, offerId = null }) => {
    const response = await api.get('/conversations/related/options', {
      params: {
        request_id: requestId || undefined,
        offer_id: offerId || undefined,
      },
    });
    return response.data;
  },

  // Get the latest unread incoming message for current user
  getLatestUnread: async () => {
    const response = await api.get('/conversations/unread-latest');
    return response.data;
  },
};

export const messagesAPI = {
  // Send a message in a conversation
  send: async (conversationId, messageText) => {
    const response = await api.post('/messages', {
      conversation_id: conversationId,
      message_text: messageText
    });
    return response.data;
  },
};

export const uploadsAPI = {
  uploadProfileImage: async (file) => {
    const payload = await fileToBase64Payload(file);
    const response = await api.post('/uploads/profile-image', payload);
    return response.data;
  },

  uploadOfferItemImage: async (file) => {
    const payload = await fileToBase64Payload(file);
    const response = await api.post('/uploads/offer-item-image', payload);
    return response.data;
  },
};

export const trustAPI = {
  getMySummary: async () => {
    const response = await api.get('/trust/me');
    return response.data;
  },

  getUserSummary: async (userId) => {
    const response = await api.get(`/trust/users/${userId}`);
    return response.data;
  },

  submitFeedback: async (transactionId, payload) => {
    const response = await api.post(`/trust/feedback/${transactionId}`, payload);
    return response.data;
  },
};

// ============================================
// Blockages API (Developer 2)
// ============================================

export const blockagesAPI = {
  getAll: async (params) => {
    const response = await api.get('/blockages', { params });
    return response.data;
  },

  create: async (blockageData) => {
    const response = await api.post('/blockages', blockageData);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/blockages/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/blockages/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/blockages/${id}`);
    return response.data;
  },

  notify: async (id) => {
    const response = await api.post(`/blockages/${id}/notify`);
    return response.data;
  },

  getNearbyUsers: async (lat, lng) => {
    const response = await api.get('/blockages/nearby-users', { params: { lat, lng } });
    return response.data;
  },
};

// ============================================
// Notifications API (Developer 2)
// ============================================

export const notificationsAPI = {
  getUnread: async () => {
    const response = await api.get('/notifications', { params: { is_read: false } });
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.put('/notifications/read-all');
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
