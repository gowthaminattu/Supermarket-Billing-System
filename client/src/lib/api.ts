import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const baseURL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
