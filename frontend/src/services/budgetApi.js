import api from './api';

export async function listBudgets(params) {
  const response = await api.get('/budgets', { params });
  return response.data.data;
}

export async function createBudget(payload) {
  const response = await api.post('/budgets', payload);
  return response.data.data.budget;
}

export async function updateBudget(id, payload) {
  const response = await api.put(`/budgets/${id}`, payload);
  return response.data.data.budget;
}

export async function deleteBudget(id) {
  await api.delete(`/budgets/${id}`);
}
