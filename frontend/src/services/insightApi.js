import api from './api';

export async function getInsights() {
  const response = await api.get('/insights');
  return response.data.data.insights;
}
