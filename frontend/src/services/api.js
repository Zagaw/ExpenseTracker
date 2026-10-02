import axios from 'axios';
import { clearStoredToken, getStoredToken } from './tokenStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(error.config?.headers?.Authorization);

    if (error.response?.status === 401 && hadToken) {
      clearStoredToken();
    }

    return Promise.reject(error);
  },
);

export function getServerOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    return '';
  }

  return apiUrl.replace(/\/api\/?$/, '');
}

export default api;
