import api from './api';

export async function registerAccount(payload) {
  const response = await api.post('/auth/register', payload);
  return response.data.data;
}

export async function loginAccount(payload) {
  const response = await api.post('/auth/login', payload);
  return response.data.data;
}

export async function fetchCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data.data.user;
}
