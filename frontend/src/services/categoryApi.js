import api from './api';

export async function listCategories() {
  const response = await api.get('/categories');
  return response.data.data.categories;
}

export async function getCategoryOverview() {
  const response = await api.get('/categories');
  return response.data.data;
}

export async function createCategory(payload) {
  const response = await api.post('/categories', payload);
  return response.data.data.category;
}

export async function updateCategory(id, payload) {
  const response = await api.put(`/categories/${id}`, payload);
  return response.data.data.category;
}

export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`);
}
