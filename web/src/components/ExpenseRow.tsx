import type { Category, Expense } from '../types';

type Props = { expense: Expense; categories: Category[]; onEdit: (e: Expense) => void; onDelete: (id: string) => void };

export function ExpenseRow({ expense, categories, onEdit, onDelete }: Props) {
    const category = categories.find((c) => c.id === expense.categoryId);

    return (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg" style={{ backgroundColor: category?.tint }}>
                {category?.emoji ?? '📦'}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{expense.title}</p>
                <p className="text-sm text-slate-500">{category?.name ?? 'Unknown'} · {expense.date}</p>
            </div>
            <p className="font-extrabold">{expense.amount.toFixed(2)}</p>
            <button onClick={() => onEdit(expense)} className="ml-2 text-sm font-semibold text-accent">Edit</button>
            <button
                onClick={() => { if (confirm(`Delete "${expense.title}"?`)) onDelete(expense.id); }}
                className="text-sm font-semibold text-danger"
            >
                Delete
            </button>
        </div>
    );
}