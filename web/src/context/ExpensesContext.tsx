import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    fetchExpenses, fetchCategories, createExpense,
    updateExpense as apiUpdateExpense, deleteExpense as apiDeleteExpense,
} from '../api/expenses';
import { mapApiCategory, mapApiExpense, mapDraftToApiPayload } from '../api/mappers';
import type { Category, Expense, ExpenseDraft } from '../types';
import { useAuth } from './AuthContext';

type ExpensesContextValue = {
    categories: Category[];
    expenses: Expense[];
    loading: boolean;
    refresh: () => Promise<void>;
    addExpense: (draft: ExpenseDraft) => Promise<void>;
    editExpense: (id: string, draft: ExpenseDraft) => Promise<void>;
    removeExpense: (id: string) => Promise<void>;
};

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

function startOfYearISO(): string {
    return `${new Date().getFullYear()}-01-01`;
}

export function ExpensesProvider({ children }: { children: ReactNode }) {
    const { user, signOut } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const [categoriesRes, expensesRes] = await Promise.all([
                fetchCategories(),
                fetchExpenses({ from: startOfYearISO(), limit: 100 }),
            ]);
            setCategories(categoriesRes.map(mapApiCategory));
            setExpenses(expensesRes.expenses.map(mapApiExpense));
        } catch (err: any) {
            if (err?.response?.status === 401) {
                await signOut();
                return;
            }
            console.error('Failed to load expenses/categories', err);
        } finally {
            setLoading(false);
        }
    }, [signOut]);

    useEffect(() => {
        if (user) load();
    }, [user, load]);

    async function addExpense(draft: ExpenseDraft) {
        const created = await createExpense(mapDraftToApiPayload(draft));
        setExpenses((prev) => [mapApiExpense(created), ...prev]);
    }
    async function editExpense(id: string, draft: ExpenseDraft) {
        const updated = await apiUpdateExpense(id, mapDraftToApiPayload(draft));
        setExpenses((prev) => prev.map((e) => (e.id === id ? mapApiExpense(updated) : e)));
    }
    async function removeExpense(id: string) {
        await apiDeleteExpense(id);
        setExpenses((prev) => prev.filter((e) => e.id !== id));
    }

    return (
        <ExpensesContext.Provider value={{ categories, expenses, loading, refresh: load, addExpense, editExpense, removeExpense }}>
            {children}
        </ExpensesContext.Provider>
    );
}

export function useExpenses() {
    const ctx = useContext(ExpensesContext);
    if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
    return ctx;
}