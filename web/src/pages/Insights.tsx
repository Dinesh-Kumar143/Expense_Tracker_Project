import { useEffect, useState } from 'react';
import { useExpenses } from '../context/ExpensesContext';
import {
    fetchAnalyticsSummary, fetchTrend, fetchDailyTrend, fetchCategoryBreakdown, fetchDayOfWeek,
    fetchBudgets, setBudget as apiSetBudget, fetchDashboard
} from '../api/analytics';
import { LineChart } from '../components/LineChart';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Insights() {
    const { categories } = useExpenses();

    const [summary, setSummary] = useState<any>(null);
    const [monthlyTrend, setMonthlyTrend] = useState<{ label: string; value: number }[]>([]);
    const [dailyTrend, setDailyTrend] = useState<{ label: string; value: number }[]>([]);
    const [breakdown, setBreakdown] = useState<any[]>([]);
    const [dayOfWeek, setDayOfWeek] = useState<{ day: number; total: number }[]>([]);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [budgetAmount, setBudgetAmount] = useState('');
    const [savingBudget, setSavingBudget] = useState(false);

    useEffect(() => { load(); }, []);

    // async function load() {
    //     try {
    //         const [summaryRes, trendRes, dailyRes, breakdownRes, dowRes, budgetsRes] = await Promise.all([
    //             fetchAnalyticsSummary(), fetchTrend(6), fetchDailyTrend(), fetchCategoryBreakdown(), fetchDayOfWeek(), fetchBudgets(),
    //         ]);
    //         setSummary(summaryRes);
    //         setMonthlyTrend(trendRes.map((t: any) => ({ label: MONTH_LABELS[new Date(t.month).getMonth()], value: t.total })));
    //         setDailyTrend(dailyRes.map((d: any) => ({ label: String(new Date(d.date).getDate()), value: d.total })));
    //         setBreakdown(breakdownRes.breakdown);
    //         setDayOfWeek(dowRes);
    //         setBudgets(budgetsRes);
    //     } catch (err) {
    //         console.error('Failed to load analytics', err);
    //     } finally {
    //         setLoading(false);
    //     }
    // }


    async function load() {
        try {
            const dashboard = await fetchDashboard();
            setSummary(dashboard.summary);
            setMonthlyTrend(dashboard.trend.map((t: any) => ({ label: MONTH_LABELS[new Date(t.month).getMonth()], value: t.total })));
            setDailyTrend(dashboard.dailyTrend.map((d: any) => ({ label: String(new Date(d.date).getDate()), value: d.total })));
            setBreakdown(dashboard.categoryBreakdown.breakdown);
            setDayOfWeek(dashboard.dayOfWeek);
            setBudgets(dashboard.budgets);
        } catch (err) {
            console.error('Failed to load analytics', err);
        } finally {
            setLoading(false);
        }
    }


    function openBudgetEditor(categoryId: string, currentAmount?: number) {
        setEditingCategoryId(categoryId);
        setBudgetAmount(currentAmount ? String(currentAmount) : '');
    }

    async function handleSaveBudget() {
        if (!editingCategoryId) return;
        const parsed = Number(budgetAmount);
        if (!budgetAmount || !Number.isFinite(parsed) || parsed <= 0) return;
        setSavingBudget(true);
        try {
            await apiSetBudget(editingCategoryId, parsed);
            setEditingCategoryId(null);
            load();
        } finally {
            setSavingBudget(false);
        }
    }

    if (loading || !summary) return <p className="text-slate-500">Loading...</p>;

    const dowMax = Math.max(...dayOfWeek.map((d) => d.total), 1);
    const dowByDay = Object.fromEntries(dayOfWeek.map((d) => [d.day, d.total]));
    const mom = summary.monthOverMonth.percentChange;

    return (
        <div className="max-w-6xl">
            <div className="flex items-baseline justify-between">
                <h1 className="text-2xl font-extrabold">Insights</h1>
                <p className="text-xs text-slate-500">Your spending, at a glance</p>
            </div>

            {/* KPI row — 4 across on desktop, 2 on small screens */}
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl bg-primary p-4 text-white">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-accent-soft">This Month</p>
                        {mom !== null && (
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${mom >= 0 ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent-dark'}`}>
                                {mom >= 0 ? '+' : ''}{mom.toFixed(0)}%
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-2xl font-extrabold">{summary.month.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-[11px] font-bold uppercase text-slate-500">Today</p>
                    <p className="mt-1 text-xl font-extrabold">{summary.today.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-[11px] font-bold uppercase text-slate-500">This Year</p>
                    <p className="mt-1 text-xl font-extrabold">{summary.year.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-[11px] font-bold uppercase text-slate-500">Top Category</p>
                    {summary.topCategory ? (
                        <p className="mt-1 truncate text-base font-extrabold">{summary.topCategory.name} · {summary.topCategory.percentage.toFixed(0)}%</p>
                    ) : <p className="mt-1 text-sm text-slate-400">No data</p>}
                </div>
            </div>

            {/* Charts — side by side on desktop */}
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Monthly Trend</p>
                    <LineChart data={monthlyTrend} height={90} />
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Daily Trend (This Month)</p>
                    <LineChart data={dailyTrend} height={90} color="#3B82F6" />
                </div>
            </div>

            {/* Day of week + category breakdown — side by side on desktop */}
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">By Day of Week</p>
                    {DAY_LABELS.map((label, i) => (
                        <div key={i} className="flex items-center gap-2 py-1">
                            <span className="w-7 text-[11px] font-bold text-slate-500">{label}</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                                <div className="h-full rounded-full bg-accent" style={{ width: `${((dowByDay[i] ?? 0) / dowMax) * 100}%` }} />
                            </div>
                            <span className="w-14 text-right text-[11px] font-bold text-slate-500">{(dowByDay[i] ?? 0).toFixed(0)}</span>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">By Category (This Month)</p>
                    {breakdown.length === 0 ? (
                        <p className="text-sm text-slate-500">No expenses logged this month yet.</p>
                    ) : (
                        breakdown.map((b) => {
                            const cat = categories.find((c) => c.id === b.categoryId);
                            return (
                                <div key={b.categoryId} className="flex items-center gap-2 py-1">
                                    <span className="text-xs">{cat?.emoji ?? '📦'}</span>
                                    <span className="w-20 shrink-0 truncate text-[11px] font-semibold">{b.name}</span>
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                                        <div className="h-full rounded-full" style={{ width: `${b.percentage}%`, backgroundColor: cat?.color ?? '#94A3B8' }} />
                                    </div>
                                    <span className="w-9 text-right text-[11px] font-bold text-slate-500">{b.percentage.toFixed(0)}%</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Budgets — compact card grid */}
            <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Budgets</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((c) => {
                    const budget = budgets.find((b) => b.categoryId === c.id);
                    const isEditing = editingCategoryId === c.id;
                    return (
                        <div key={c.id} className="rounded-xl border border-border bg-surface p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">{c.emoji} {c.name}</span>
                                {!isEditing && (
                                    <button onClick={() => openBudgetEditor(c.id, budget?.amount)} className="text-[11px] font-bold text-accent">
                                        {budget ? 'Edit' : 'Set'}
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="mt-2 flex gap-1.5">
                                    <input
                                        value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                        placeholder="0.00" autoFocus
                                        className="w-0 flex-1 rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-accent"
                                    />
                                    <button onClick={handleSaveBudget} disabled={savingBudget} className="rounded-md bg-accent px-2 py-1 text-[11px] font-bold text-white disabled:opacity-60">
                                        {savingBudget ? '...' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditingCategoryId(null)} className="rounded-md border border-border px-2 py-1 text-[11px] font-bold text-slate-500">
                                        ✕
                                    </button>
                                </div>
                            ) : budget ? (
                                <>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${Math.min(100, budget.percentage)}%`,
                                                backgroundColor: budget.isOverBudget ? '#DC2626' : budget.isNearLimit ? '#F59E0B' : '#10B981',
                                            }}
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] font-semibold text-slate-500">
                                        {budget.spent.toFixed(0)} / {budget.amount.toFixed(0)}
                                        {budget.isOverBudget && ' ⚠️'}
                                        {budget.isNearLimit && !budget.isOverBudget && ' ⚠️'}
                                    </p>
                                </>
                            ) : (
                                <p className="mt-2 text-[11px] text-slate-400">No budget set</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}