import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpensesContext';
import { createCategory, deleteCategory as apiDeleteCategory } from '../api/expenses';

export function Account() {
    const { user, signOut } = useAuth();
    const { categories, expenses, refresh } = useExpenses();
    const [newCatName, setNewCatName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleAddCategory() {
        const trimmed = newCatName.trim();
        if (!trimmed) return setError('Enter a category name.');
        if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return setError('Already exists.');
        setSaving(true);
        setError('');
        try {
            await createCategory({ name: trimmed });
            await refresh();
            setNewCatName('');
        } catch {
            setError('Could not add category.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteCategory(category: (typeof categories)[number]) {
        if (category.isDefault) return;
        const hasExpenses = expenses.some((e) => e.categoryId === category.id);
        const otherCategory = categories.find((c) => c.name.toLowerCase() === 'other');

        if (hasExpenses) {
            const count = expenses.filter((e) => e.categoryId === category.id).length;
            if (!confirm(`This category has ${count} expense(s). Delete anyway? They'll move to "Other".`)) return;
            await apiDeleteCategory(category.id, otherCategory?.id);
        } else {
            if (!confirm(`Delete "${category.name}"?`)) return;
            await apiDeleteCategory(category.id);
        }
        await refresh();
    }

    const initials = (user?.name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div className="max-w-xl">
            <h1 className="text-3xl font-extrabold">Account</h1>
            <p className="mt-1 text-sm text-slate-500">Profile & categories</p>

            <div className="mt-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-white">{initials}</div>
                <div>
                    <p className="font-extrabold">{user?.name}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
            </div>

            <p className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">Manage Categories</p>
            <div className="mt-2 rounded-xl border border-border bg-surface p-4">
                {categories.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 py-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm" style={{ backgroundColor: c.tint }}>{c.emoji}</span>
                        <span className="flex-1 text-sm font-semibold">{c.name}</span>
                        {c.isDefault && <span className="mr-2 text-xs font-bold text-slate-400">Default</span>}
                        {!c.isDefault && (
                            <button onClick={() => handleDeleteCategory(c)} className="text-sm text-danger">Delete</button>
                        )}
                    </div>
                ))}

                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                    <input
                        value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="New category name" maxLength={20}
                        className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <button onClick={handleAddCategory} disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                        Add
                    </button>
                </div>
                {error && <p className="mt-2 text-xs text-danger">{error}</p>}
                <p className="mt-2 text-xs text-slate-400">Icon and color are assigned automatically based on the name.</p>
            </div>

            <button onClick={() => signOut()} className="mt-8 rounded-lg bg-danger px-5 py-2.5 text-sm font-bold text-white">
                Log out
            </button>
        </div>
    );
}