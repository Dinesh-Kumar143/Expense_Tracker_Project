import api from './api';

export async function fetchAnalyticsSummary() {
    const { data } = await api.get('/analytics/summary');
    return data;
}

export async function fetchTrend(months = 6) {
    const { data } = await api.get('/analytics/trend', { params: { months } });
    return data.trend;
}

export async function fetchDailyTrend(params = {}) {
    const { data } = await api.get('/analytics/daily-trend', { params });
    return data.daily;
}

export async function fetchCategoryBreakdown(params = {}) {
    const { data } = await api.get('/analytics/category-breakdown', { params });
    return data;
}

export async function fetchDayOfWeek(params = {}) {
    const { data } = await api.get('/analytics/day-of-week', { params });
    return data.breakdown;
}

export async function fetchBudgets() {
    const { data } = await api.get('/budgets');
    return data.budgets;
}

export async function setBudget(categoryId, amount) {
    const { data } = await api.post('/budgets', { categoryId, amount });
    return data.budget;
}

export async function deleteBudget(categoryId) {
    await api.delete(`/budgets/${categoryId}`);
}

export async function fetchDashboard() {
    const { data } = await api.get('/analytics/dashboard');
    return data;
}