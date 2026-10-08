import api from './api.js';

export async function fetchExpenses(params = {}) {
    const { data } = await api.get('/expenses', { params });
    return data;
}

export async function createExpense(expense) {
    const { data } = await api.post('/expenses', expense);
    return data.expense;
}

export async function updateExpense(id, updates) {
    const { data } = await api.put(`/expenses/${id}`, updates);
    return data.expense;
}

export async function deleteExpense(id) {
    await api.delete(`/expenses/${id}`);
}

export async function fetchCategories() {
    const { data } = await api.get(`/categories`);
    return data.categories;
}

export async function createCategory(category) {
    const { data } = await api.post('/categories', category);
    return data.category;
}

export async function deleteCategory(id, reassignTo) {
    await api.delete(`/categories/${id}`, { data: reassignTo ? { reassignTo } : {} });
}
