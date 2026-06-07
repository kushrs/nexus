import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 and 429
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 429) {
      error.rateLimited = true;
      error.message = 'Rate limit exceeded. Please wait before making more requests.';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// ==================== USERS ====================
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// ==================== PAYMENTS ====================
export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  create: (data) => api.post('/payments', data),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  create: (data) => api.post('/notifications', data),
};

// ==================== LOGS / DASHBOARD ====================
export const logsAPI = {
  getDashboard: () => api.get('/logs/dashboard'),
  getAll: () => api.get('/logs'),
};

// ==================== ML PREDICTIONS ====================
export const mlAPI = {
  getPredictions: () => api.get('/logs/ml/predictions'),
  getAnomalies: () => api.get('/logs/ml/anomalies'),
  applyPolicy: (data) => api.post('/logs/ml/policies', data),
};

export default api;
