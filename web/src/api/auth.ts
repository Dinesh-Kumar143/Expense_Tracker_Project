import api from './client';

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('authToken', data.token);
  return data.user;
}

export async function signup(name: string, email: string, password: string) {
  const { data } = await api.post('/auth/signup', { name, email, password });
  localStorage.setItem('authToken', data.token);
  return data.user;
}

export async function logout() {
  localStorage.removeItem('authToken');
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function updateProfile(updates: { name?: string; email?: string }) {
  const { data } = await api.put('/auth/me', updates);
  return data.user;
}