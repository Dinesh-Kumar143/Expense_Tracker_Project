import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { login as apiLogin, signup as apiSignup, logout as apiLogout, getCurrentUser, updateProfile as apiUpdateProfile } from '../api/auth';

type User = { id: string; name: string; email: string };

type AuthContextValue = {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (name: string, email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (updates: { name?: string; email?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('authToken');
            if (!token) { setIsLoading(false); return; }
            try {
                const me = await getCurrentUser();
                setUser(me);
            } catch {
                localStorage.removeItem('authToken');
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
    async function updateProfile(updates: { name?: string; email?: string }) {
        const updated = await apiUpdateProfile(updates);
        setUser(updated);
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}