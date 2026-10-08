import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpensesContext';
import { useTheme } from '../context/ThemeContext';
import { createCategory, deleteCategory as apiDeleteCategory } from '../api/expenses';

type Props = { open: boolean; onClose: () => void };

export function AccountModal({ open, onClose }: Props) {
    const { user, signOut, updateProfile } = useAuth();
    const { categories, expenses, refresh } = useExpenses();
    const { isDark, toggleDarkMode } = useTheme();

    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [newCatName, setNewCatName] = useState('');
    const [catSaving, setCatSaving] = useState(false);
    const [catError, setCatError] = useState('');

    if (!open) return null;

    async function handleSaveProfile() {
        setProfileError('');
        if (!name.trim() || !email.trim()) return setProfileError('Name and email are required.');
        setProfileSaving(true);
        try {
            await updateProfile({ name: name.trim(), email: email.trim() });
        } catch (err: any) {
            setProfileError(err?.response?.data?.error ?? 'Could not update profile.');
        } finally {
            setProfileSaving(false);
        }
    }

    async function handleAddCategory() {
        const trimmed = newCatName.trim();
        if (!trimmed) return setCatError('Enter a category name.');
        if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return setCatError('Already exists.');
        setCatSaving(true);
        setCatError('');
        try {
            await createCategory({ name: trimmed });
            await refresh();
            setNewCatName('');
        } catch {
            setCatError('Could not add category.');
        } finally {
            setCatSaving(false);
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

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold">Account & Settings</h2>
                    <button onClick={onClose} className="text-xl text-primary-light">✕</button>
                </div>

                {/* Profile */}
                <p className="mt-6 text-xs font-bold uppercase tracking-wide text-primary-light">Profile</p>
                <div className="mt-2 rounded-xl border border-border p-4">
                    {profileError && <p className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{profileError}</p>}
                    <label className="block text-xs font-bold uppercase tracking-wide">Name</label>
                    <input
                        value={name} onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <label className="mt-3 block text-xs font-bold uppercase tracking-wide">Email</label>
                    <input
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <button
                        onClick={handleSaveProfile} disabled={profileSaving}
                        className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                        {profileSaving ? 'Saving...' : 'Save profile'}
                    </button>
                </div>

                {/* Preferences */}
                <p className="mt-6 text-xs font-bold uppercase tracking-wide text-primary-light">Preferences</p>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-border p-4">
                    <span className="text-sm font-semibold">🌙 Dark mode</span>
                    <button
                        onClick={toggleDarkMode}
                        className={`h-6 w-11 pb-1 rounded-full transition-colors ${isDark ? 'bg-accent' : 'bg-border'}`}
                    >
                        <span className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                </div>

                {/* Categories */}
                <p className="mt-6 text-xs font-bold uppercase tracking-wide text-primary-light">Manage Categories</p>
                <div className="mt-2 rounded-xl border border-border p-4">
                    {categories.map((c) => (
                        <div key={c.id} className="flex items-center gap-3 py-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm" style={{ backgroundColor: c.tint }}>{c.emoji}</span>
                            <span className="flex-1 text-sm font-semibold">{c.name}</span>
                            {c.isDefault && <span className="mr-2 text-xs font-bold text-primary-light">Default</span>}
                            {!c.isDefault && <button onClick={() => handleDeleteCategory(c)} className="text-sm text-danger">Delete</button>}
                        </div>
                    ))}
                    <div className="mt-3 flex gap-2 border-t border-border pt-3">
                        <input
                            value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="New category name" maxLength={20}
                            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                        <button onClick={handleAddCategory} disabled={catSaving} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                            Add
                        </button>
                    </div>
                    {catError && <p className="mt-2 text-xs text-danger">{catError}</p>}
                </div>

                <button onClick={() => signOut()} className="mt-6 w-full rounded-lg bg-danger px-5 py-2.5 text-sm font-bold text-white">
                    Log out
                </button>
            </div>
        </div>
    );
}