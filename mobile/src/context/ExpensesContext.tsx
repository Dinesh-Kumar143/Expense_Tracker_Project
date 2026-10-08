import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
    fetchExpenses, fetchCategories, createExpense,
    updateExpense as apiUpdateExpense, deleteExpense as apiDeleteExpense,
} from '../services/expenses';
import { mapApiCategory, mapApiExpense, mapDraftToApiPayload } from '../services/mappers';
import { Category, Expense, ExpenseDraft } from '../types';
import { useAuth } from './AuthContext';
import Logger from '../logging/Logger';

type ExpensesContextValue = {
    categories: Category[];
    expenses: Expense[]; // current calendar year only, see note below
    loading: boolean;
    refreshing: boolean;
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
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const [categoriesRes, expensesRes] = await Promise.all([
                fetchCategories(),
                fetchExpenses({ from: startOfYearISO(), limit: 100 }),
            ]);
            setCategories(categoriesRes.map(mapApiCategory));
            setExpenses(expensesRes.expenses.map(mapApiExpense));
            // Note: caps at 100 expenses for the current year. Fine for a personal tracker's
            // first pass — worth paginating fully once that becomes a realistic ceiling.
        } catch (err: any) {
            if (err?.response?.status === 401) {
                await signOut();
                return;
            }
            Logger.logError('Failed to load expenses/categories', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
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
        <ExpensesContext.Provider
            value={{ categories, expenses, loading, refreshing, refresh: () => load(true), addExpense, editExpense, removeExpense }}
        >
            {children}
        </ExpensesContext.Provider>
    );
}

export function useExpenses() {
    const ctx = useContext(ExpensesContext);
    if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
    return ctx;
}