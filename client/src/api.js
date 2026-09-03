import axios from 'axios';

let rawBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').trim();
if (rawBase.endsWith('/')) rawBase = rawBase.slice(0, -1);
if (!rawBase.endsWith('/api')) rawBase = `${rawBase}/api`;
const baseURL = rawBase;

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('amc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler — clear stale token and redirect to login only for protected admin/officer routes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('amc_token');
      localStorage.removeItem('amc_user');
      const path = window.location.pathname;
      // Only redirect if on protected admin or officer paths
      if (path.startsWith('/admin') || path.startsWith('/officer')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const fileUrl = (p) => (p?.startsWith('http') ? p : `${baseURL.replace(/\/api$/, '')}${p}`);

export default api;
