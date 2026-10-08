import * as SecureStore from "expo-secure-store";
import api from "./api.js";

export async function signup(name, email, password) {
    const { data } = await api.post('/auth/signup', { name, email, password });
    await SecureStore.setItemAsync('authToken', data.token);
    return data.user;
}

export async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync("authToken", data.token);
    return data.user;
}

export async function logout() {
    await SecureStore.deleteItemAsync("authToken");
}

export async function getCurrentUser() {
    const { data } = await api.get('/auth/me');
    return data.user;
}

