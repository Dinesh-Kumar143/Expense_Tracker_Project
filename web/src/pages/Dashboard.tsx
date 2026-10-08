import { useState } from 'react';
import { useExpenses } from '../context/ExpensesContext';
import { ExpenseRow } from '../components/ExpenseRow';
import { ExpenseModal } from '../components/ExpenseModal';
import type { Expense, ExpenseDraft } from '../types';

export function Dashboard() {
    const { expenses, categories, loading, addExpense, editExpense, removeExpense } = useExpenses();
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Expense | null>(null);

    const now = new Date();
    const monthlySpent = expenses
        .filter((e) => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, e) => sum + e.amount, 0);

    function openAdd() { setEditing(null); setModalOpen(true); }
    function openEdit(e: Expense) { setEditing(e); setModalOpen(true); }

    async function handleSave(draft: ExpenseDraft) {
        if (editing) await editExpense(editing.id, draft);
        else await addExpense(draft);
    }

    if (loading) return <p className="text-slate-500">Loading...</p>;

    return (
        <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold">Your spending</h1>

            <div className="mt-5 rounded-2xl bg-accent p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-wide opacity-85">Spent this month</p>
                <p className="mt-1 text-2xl font-extrabold">{monthlySpent.toFixed(2)}</p>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Recent Expenses</p>
                <button onClick={openAdd} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white">+ Add Expense</button>
            </div>

            <div className="mt-3 flex flex-col gap-2">
                {expenses.length === 0 ? (
                    <p className="py-10 text-center text-slate-500">No expenses yet. Add your first one above.</p>
                ) : (
                    expenses.slice(0, 20).map((e) => (
                        <ExpenseRow key={e.id} expense={e} categories={categories} onEdit={openEdit} onDelete={removeExpense} />
                    ))
                )}
            </div>

            <ExpenseModal
                open={modalOpen}
                expense={editing}
                categories={categories}
                onClose={() => { setModalOpen(false); setEditing(null); }}
                onSave={handleSave}
            />
        </div>
    );
}