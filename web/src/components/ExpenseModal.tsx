import { useEffect, useState } from 'react';
import type { Category, Expense, ExpenseDraft } from '../types';
import { CategoryChips } from './CategoryChips';

type Props = {
    open: boolean;
    expense?: Expense | null;
    categories: Category[];
    onClose: () => void;
    onSave: (draft: ExpenseDraft) => Promise<void>;
};

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

export function ExpenseModal({ open, expense, categories, onClose, onSave }: Props) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [date, setDate] = useState(todayISO());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setTitle(expense?.title ?? '');
        setAmount(expense ? String(expense.amount) : '');
        setCategoryId(expense?.categoryId ?? categories[0]?.id ?? '');
        setDate(expense?.date ?? todayISO());
        setError('');
    }, [open, expense, categories]);

    if (!open) return null;

    async function handleSave() {
        const trimmed = title.trim();
        const parsed = Number(amount);
        if (!trimmed) return setError('Add a description.');
        if (!amount || !Number.isFinite(parsed) || parsed <= 0) return setError('Enter a valid amount.');
        if (!categoryId) return setError('Select a category.');

        setSaving(true);
        try {
            await onSave({ title: trimmed, amount: parsed.toFixed(2), categoryId, date });
            onClose();
        } catch {
            setError('Could not save. Try again.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
                <h2 className="text-xl font-extrabold">{expense ? 'Edit expense' : 'Add expense'}</h2>

                {error && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

                <label className="mt-5 block text-xs font-bold uppercase tracking-wide">Category</label>
                <div className="mt-1.5"><CategoryChips categories={categories} value={categoryId} onChange={setCategoryId} /></div>

                <label className="mt-4 block text-xs font-bold uppercase tracking-wide">Amount</label>
                <input
                    value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 outline-none focus:border-accent"
                    placeholder="0.00"
                />

                <label className="mt-4 block text-xs font-bold uppercase tracking-wide">Description</label>
                <input
                    value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
                    className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 outline-none focus:border-accent"
                    placeholder="Coffee, groceries, fuel..."
                />

                <label className="mt-4 block text-xs font-bold uppercase tracking-wide">Date</label>
                <input
                    type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 outline-none focus:border-accent"
                />

                <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 font-bold text-slate-600">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-accent py-2.5 font-extrabold text-white disabled:opacity-60">
                        {saving ? 'Saving...' : expense ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}