import api from './api';

export async function updateProfile(payload) {
  const response = await api.put('/profile', payload);
  return response.data.data.profile;
}
