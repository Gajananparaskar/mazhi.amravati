import axios from 'axios';

function getBaseUrl() {
  let envUrl = (import.meta.env.VITE_API_URL || '').trim();
  
  if (!envUrl) {
    if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
      const apiHost = window.location.hostname.replace(/-(?:web|frontend)/i, '-api');
      envUrl = `https://${apiHost}/api`;
    } else {
      envUrl = 'http://localhost:4000/api';
    }
  }

  if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
    envUrl = `https://${envUrl}`;
  }
  if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
  if (!envUrl.endsWith('/api')) envUrl = `${envUrl}/api`;
  return envUrl;
}

const baseURL = getBaseUrl();

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
