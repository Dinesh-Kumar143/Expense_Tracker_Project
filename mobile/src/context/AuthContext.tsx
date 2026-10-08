import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
    login as apiLogin,
    signup as apiSignup,
    logout as apiLogout,
    getCurrentUser,
} from '../services/auth';

type User = { id: string; name: string; email: string };

type AuthContextValue = {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (name: string, email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync('authToken');
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const me = await getCurrentUser();
                setUser(me);
            } catch {
                await SecureStore.deleteItemAsync('authToken');
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    async function signIn(email: string, password: string) {
        const loggedInUser = await apiLogin(email, password);
        setUser(loggedInUser);
    }

    async function signUp(name: string, email: string, password: string) {
        const newUser = await apiSignup(name, email, password);
        setUser(newUser);
    }

    async function signOut() {
        await apiLogout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}