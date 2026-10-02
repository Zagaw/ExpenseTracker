import api from './api';

export async function listIncome(params) {
  const response = await api.get('/income', { params });
  return response.data.data;
}

export async function createIncome(payload) {
  const response = await api.post('/income', payload);
  return response.data.data.income;
}

export async function updateIncome(id, payload) {
  const response = await api.put(`/income/${id}`, payload);
  return response.data.data.income;
}

export async function deleteIncome(id) {
  await api.delete(`/income/${id}`);
}
