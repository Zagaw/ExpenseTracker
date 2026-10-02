import api from './api';

export async function listExpenses(params) {
  const response = await api.get('/expenses', { params });
  return response.data.data;
}

export async function createExpense(payload) {
  const response = await api.post('/expenses', payload);
  return response.data.data.expense;
}

export async function updateExpense(id, payload) {
  const response = await api.put(`/expenses/${id}`, payload);
  return response.data.data.expense;
}

export async function deleteExpense(id) {
  await api.delete(`/expenses/${id}`);
}

export async function exportExpenses(params) {
  const response = await api.get('/expenses/export', {
    params,
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const match = /filename="([^"]+)"/.exec(response.headers['content-disposition'] || '');
  link.href = url;
  link.download = match?.[1] || 'expenses.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
