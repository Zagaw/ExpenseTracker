import api from './api';

export async function getDashboard() {
  const response = await api.get('/dashboard/summary');
  return response.data.data;
}
