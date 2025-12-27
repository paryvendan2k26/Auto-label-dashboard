import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Proxied through Vite to http://localhost:5000/api
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (optional - for logging)
api.interceptors.request.use(
  (config) => {
    console.log(`🔵 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (optional - for error handling)
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 ${response.config.method.toUpperCase()} ${response.config.url} - Success`);
    return response;
  },
  (error) => {
    console.error(`🔴 ${error.config?.method?.toUpperCase()} ${error.config?.url} - Error:`, error.message);
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
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

  acceptLabel: (itemId, reviewedBy = 'user') => 
    api.put(`/labels/${itemId}`, { action: 'accept', reviewedBy }),

  modifyLabel: (itemId, newLabel, reviewedBy = 'user') => 
    api.put(`/labels/${itemId}`, { action: 'modify', newLabel, reviewedBy }),

  batchAccept: (itemIds, reviewedBy = 'user') => 
    api.post('/labels/batch-accept', { itemIds, reviewedBy }),

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