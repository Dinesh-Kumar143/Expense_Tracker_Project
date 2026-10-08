import { useEffect, useMemo, useState } from 'react';
import { ExpenseRow } from '../components/ExpenseRow';
import { ExpenseModal } from '../components/ExpenseModal';
import { useExpenses } from '../context/ExpensesContext';
import { fetchExpenses } from '../api/expenses';
import { mapApiExpense } from '../api/mappers';
import type { Expense, ExpenseDraft } from '../types';

type RangeFilter = 'month' | 'lastMonth' | 'year' | 'all';

function toISODate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getRangeDates(range: RangeFilter): { from?: string; to?: string } {
    const now = new Date();
    if (range === 'month') return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISODate(now) };
    if (range === 'lastMonth') {
        const to = new Date(now.getFullYear(), now.getMonth(), 0);
        const from = new Date(to.getFullYear(), to.getMonth(), 1);
        return { from: toISODate(from), to: toISODate(to) };
    }
    if (range === 'year') return { from: toISODate(new Date(now.getFullYear(), 0, 1)), to: toISODate(now) };
    return {};
}

function groupByDate(expenses: Expense[]) {
    const groups = new Map<string, Expense[]>();
    expenses.forEach((e) => { const list = groups.get(e.date) ?? []; list.push(e); groups.set(e.date, list); });
    const todayISO = toISODate(new Date());
    const yesterdayISO = toISODate(new Date(Date.now() - 86400000));
    return [...groups.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, data]) => ({ title: date === todayISO ? 'Today' : date === yesterdayISO ? 'Yesterday' : date, data }));
}

export function Reports() {
    const { categories, editExpense, removeExpense } = useExpenses();
    const [range, setRange] = useState<RangeFilter>('month');
    const [categoryId, setCategoryId] = useState('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [results, setResults] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Expense | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { load(); }, [range, categoryId, debouncedSearch]);

    async function load() {
        setLoading(true);
        try {
            const { from, to } = getRangeDates(range);
            const params: Record<string, string | number> = { limit: 100 };
            if (from) params.from = from;
            if (to) params.to = to;
            if (categoryId !== 'all') params.category = categoryId;
            if (debouncedSearch) params.search = debouncedSearch;
            const res = await fetchExpenses(params);
            setResults(res.expenses.map(mapApiExpense));
        } finally {
            setLoading(false);
        }
    }

    const grouped = useMemo(() => groupByDate(results), [results]);
    const total = useMemo(() => results.reduce((s, e) => s + e.amount, 0), [results]);

    function openEdit(e: Expense) { setEditing(e); setModalOpen(true); }
    async function handleSave(draft: ExpenseDraft) {
        if (!editing) return;
        await editExpense(editing.id, draft);
        load();
    }
    async function handleDelete(id: string) {
        await removeExpense(id);
        setResults((prev) => prev.filter((e) => e.id !== id));
    }

    function handleExport() {
        if (results.length === 0) return;
        function sanitizeCsvField(value: string): string {
            return /^[=+\-@]/.test(value) ? `'${value}` : value;
        }
        const header = 'Date,Category,Description,Amount\n';
        const rows = results.map((e) => {
            const cat = sanitizeCsvField(categories.find((c) => c.id === e.categoryId)?.name ?? 'Unknown');
            const title = sanitizeCsvField(e.title);
            return `${e.date},${cat},"${title.replace(/"/g, '""')}",${e.amount.toFixed(2)}`;
        });
        const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const rangeOptions: { key: RangeFilter; label: string }[] = [
        { key: 'month', label: 'This month' },
        { key: 'lastMonth', label: 'Last month' },
        { key: 'year', label: 'This year' },
        { key: 'all', label: 'All time' },
    ];

    return (
        <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold">Reports</h1>
            <p className="mt-1 text-sm text-slate-500">Search and filter your history</p>

            <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search expenses..."
                className="mt-5 w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
            />

            <div className="mt-3 flex flex-wrap gap-2">
                {rangeOptions.map((opt) => (
                    <button
                        key={opt.key} onClick={() => setRange(opt.key)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${range === opt.key ? 'border-accent bg-accent-soft text-accent' : 'border-border text-slate-500'}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
                <button
                    onClick={() => setCategoryId('all')}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${categoryId === 'all' ? 'border-accent bg-accent-soft text-accent' : 'border-border text-slate-500'}`}
                >
                    All categories
                </button>
                {categories.map((c) => (
                    <button
                        key={c.id} onClick={() => setCategoryId(c.id)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${categoryId === c.id ? 'border-accent bg-accent-soft text-accent' : 'border-border text-slate-500'}`}
                    >
                        {c.emoji} {c.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="mt-6 text-slate-500">Loading...</p>
            ) : (
                <>
                    <p className="mt-5 text-sm font-semibold text-slate-500">Total: {total.toFixed(2)} · {results.length} expense{results.length !== 1 ? 's' : ''}</p>
                    {grouped.length === 0 ? (
                        <p className="mt-6 text-center text-slate-500">No expenses match these filters.</p>
                    ) : (
                        grouped.map((group) => (
                            <div key={group.title} className="mt-4">
                                <p className="mb-2 text-xs font-bold text-slate-500">{group.title}</p>
                                <div className="flex flex-col gap-2">
                                    {group.data.map((e) => (
                                        <ExpenseRow key={e.id} expense={e} categories={categories} onEdit={openEdit} onDelete={handleDelete} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            <button onClick={handleExport} className="mt-6 w-full rounded-xl border border-dashed border-border py-3 text-sm font-bold text-slate-500">
                ⬇ Export as CSV
            </button>

            <ExpenseModal
                open={modalOpen} expense={editing} categories={categories}
                onClose={() => { setModalOpen(false); setEditing(null); }}
                onSave={handleSave}
            />
        </div>
    );
}