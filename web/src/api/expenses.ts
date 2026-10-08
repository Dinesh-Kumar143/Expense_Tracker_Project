import api from './client';

export async function fetchExpenses(params: Record<string, string | number> = {}) {
  const { data } = await api.get('/expenses', { params });
  return data; // { expenses, pagination }
}

export async function createExpense(expense: Record<string, unknown>) {
  const { data } = await api.post('/expenses', expense);
  return data.expense;
}

export async function updateExpense(id: string, updates: Record<string, unknown>) {
  const { data } = await api.put(`/expenses/${id}`, updates);
  return data.expense;
}

export async function deleteExpense(id: string) {
  await api.delete(`/expenses/${id}`);
}

export async function fetchCategories() {
  const { data } = await api.get('/categories');
  return data.categories;
}

export async function createCategory(category: Record<string, unknown>) {
  const { data } = await api.post('/categories', category);
  return data.category;
}

export async function deleteCategory(id: string, reassignTo?: string) {
  await api.delete(`/categories/${id}`, { data: reassignTo ? { reassignTo } : {} });
}