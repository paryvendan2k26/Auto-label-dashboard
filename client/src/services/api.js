import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Proxied through Vite to http://localhost:5000/api
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🔵 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 ${response.config.method.toUpperCase()} ${response.config.url} - Success`);
    return response;
  },
  (error) => {
    console.error(`🔴 ${error.config?.method?.toUpperCase()} ${error.config?.url} - Error:`, error.message);
    
    // If 401 (Unauthorized), clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth operations
  register: (name, email, password) => 
    api.post('/auth/register', { name, email, password }),

  login: (email, password) => 
    api.post('/auth/login', { email, password }),

  getCurrentUser: () => 
    api.get('/auth/me'),

  // Dataset operations
  uploadDataset: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getAllDatasets: () => api.get('/datasets'),

  getDataset: (id) => api.get(`/datasets/${id}`),

  configureDataset: (id, data) => api.post(`/datasets/${id}/configure`, data),

  deleteDataset: (id) => api.delete(`/datasets/${id}`),

  // Labeling operations
  startLabeling: (datasetId) => api.post(`/labels/dataset/${datasetId}/label`),

  getReviewQueue: (datasetId, params = {}) => 
    api.get(`/labels/dataset/${datasetId}/review-queue`, { params }),

  acceptLabel: (itemId) => 
    api.put(`/labels/${itemId}`, { action: 'accept' }),

  modifyLabel: (itemId, newLabel) => 
    api.put(`/labels/${itemId}`, { action: 'modify', newLabel }),

  batchAccept: (datasetId) => 
    api.post('/labels/batch-accept', { datasetId }),

  // Statistics operations
  getProgress: (datasetId) => api.get(`/stats/dataset/${datasetId}/progress`),

  getStatistics: (datasetId) => api.get(`/stats/dataset/${datasetId}/statistics`),

  getQueueSummary: (datasetId) => api.get(`/stats/dataset/${datasetId}/queue-summary`),

  exportDataset: (datasetId) => 
    api.get(`/stats/dataset/${datasetId}/export`, {
      responseType: 'blob', // Important for file download
    }),
};

export default api;