import api from './api';

export async function listRecurringExpenses() {
  const response = await api.get('/recurring-expenses');
  return response.data.data.recurringExpenses;
}

export async function createRecurringExpense(payload) {
  const response = await api.post('/recurring-expenses', payload);
  return response.data.data.recurringExpense;
}

export async function updateRecurringExpense(id, payload) {
  const response = await api.put(`/recurring-expenses/${id}`, payload);
  return response.data.data.recurringExpense;
}

export async function toggleRecurringExpense(id) {
  const response = await api.patch(`/recurring-expenses/${id}/toggle`);
  return response.data.data.recurringExpense;
}

export async function deleteRecurringExpense(id) {
  await api.delete(`/recurring-expenses/${id}`);
}
