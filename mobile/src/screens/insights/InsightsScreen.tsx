import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useExpenses } from '../../context/ExpensesContext';
import {
    fetchAnalyticsSummary, fetchTrend, fetchDailyTrend, fetchCategoryBreakdown, fetchDayOfWeek,
    fetchBudgets, setBudget as apiSetBudget, fetchDashboard
} from '../../services/analytics';
import { LineChart } from '../../components/LineChart';
import { formatMoney } from '../../utils';
import { spacing, borderRadius, typography } from '../../theme';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function InsightsScreen() {
    const { colors } = useTheme();
    const { categories } = useExpenses();
    const styles = getStyles(colors);

    const [summary, setSummary] = useState<any>(null);
    const [monthlyTrend, setMonthlyTrend] = useState<{ label: string; value: number }[]>([]);
    const [dailyTrend, setDailyTrend] = useState<{ label: string; value: number }[]>([]);
    const [breakdown, setBreakdown] = useState<any[]>([]);
    const [dayOfWeek, setDayOfWeek] = useState<{ day: number; total: number }[]>([]);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [budgetModalOpen, setBudgetModalOpen] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [budgetAmount, setBudgetAmount] = useState('');
    const [savingBudget, setSavingBudget] = useState(false);

    // const load = useCallback(async () => {
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
    // }, []);

    const load = useCallback(async () => {
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
    }, []);
    useEffect(() => { load(); }, [load]);

    function openBudgetEditor(categoryId: string, currentAmount?: number) {
        setEditingCategoryId(categoryId);
        setBudgetAmount(currentAmount ? String(currentAmount) : '');
        setBudgetModalOpen(true);
    }

    async function handleSaveBudget() {
        if (!editingCategoryId) return;
        const parsed = Number(budgetAmount);
        if (!budgetAmount || !Number.isFinite(parsed) || parsed <= 0) {
            Alert.alert('Invalid amount', 'Enter a number greater than zero.');
            return;
        }
        setSavingBudget(true);
        try {
            await apiSetBudget(editingCategoryId, parsed);
            setBudgetModalOpen(false);
            setEditingCategoryId(null);
            load();
        } catch {
            Alert.alert('Error', 'Could not save budget.');
        } finally {
            setSavingBudget(false);
        }
    }

    if (loading || !summary) {
        return <View style={styles.loading}><ActivityIndicator color={colors.accent} size="large" /></View>;
    }

    const dowMax = Math.max(...dayOfWeek.map((d) => d.total), 1);
    const dowByDay = Object.fromEntries(dayOfWeek.map((d) => [d.day, d.total]));
    const mom = summary.monthOverMonth.percentChange;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
            <Text style={styles.heading}>Insights</Text>
            <Text style={styles.sub}>Your spending, at a glance</Text>

            <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                    <Text style={styles.heroLabel}>This Month</Text>
                    {mom !== null && (
                        <View style={[styles.badge, { backgroundColor: mom >= 0 ? colors.dangerSoft : colors.successSoft }]}>
                            <Text style={{ color: mom >= 0 ? colors.danger : colors.success, fontSize: 11, fontWeight: '700' }}>
                                {mom >= 0 ? '+' : ''}{mom.toFixed(0)}% vs last month
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.heroValue}>{formatMoney(summary.month)}</Text>
            </View>

            <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Today</Text><Text style={styles.kpiValue}>{formatMoney(summary.today)}</Text></View>
                <View style={styles.kpiCard}><Text style={styles.kpiLabel}>This Year</Text><Text style={styles.kpiValue}>{formatMoney(summary.year)}</Text></View>
                <View style={[styles.kpiCard, { flexBasis: '100%' }]}>
                    <Text style={styles.kpiLabel}>Top Category</Text>
                    {summary.topCategory ? (
                        <Text style={styles.kpiValue}>{summary.topCategory.name} · {summary.topCategory.percentage.toFixed(0)}% of month</Text>
                    ) : <Text style={styles.kpiValueMuted}>No data</Text>}
                </View>
            </View>

            <Text style={styles.sectionLabel}>Monthly Trend</Text>
            <View style={styles.card}><LineChart data={monthlyTrend} /></View>

            <Text style={styles.sectionLabel}>Daily Trend (This Month)</Text>
            <View style={styles.card}><LineChart data={dailyTrend} color={colors.info} /></View>

            <Text style={styles.sectionLabel}>By Day of Week</Text>
            <View style={styles.card}>
                {DAY_LABELS.map((label, i) => (
                    <View key={i} style={styles.dowRow}>
                        <Text style={styles.dowLabel}>{label}</Text>
                        <View style={styles.track}>
                            <View style={[styles.fill, { width: `${((dowByDay[i] ?? 0) / dowMax) * 100}%`, backgroundColor: colors.accent }]} />
                        </View>
                        <Text style={styles.dowValue}>{formatMoney(dowByDay[i] ?? 0)}</Text>
                    </View>
                ))}
            </View>

            <Text style={styles.sectionLabel}>By Category (This Month)</Text>
            <View style={styles.card}>
                {breakdown.length === 0 ? (
                    <Text style={styles.emptyText}>No expenses logged this month yet.</Text>
                ) : (
                    breakdown.map((b) => {
                        const cat = categories.find((c) => c.id === b.categoryId);
                        return (
                            <View key={b.categoryId} style={styles.breakdownRow}>
                                <Text style={{ fontSize: 14 }}>{cat?.emoji ?? '📦'}</Text>
                                <Text style={styles.breakdownName} numberOfLines={1}>{b.name}</Text>
                                <View style={styles.track}>
                                    <View style={[styles.fill, { width: `${b.percentage}%`, backgroundColor: cat?.color ?? colors.textMuted }]} />
                                </View>
                                <Text style={styles.pct}>{b.percentage.toFixed(0)}%</Text>
                            </View>
                        );
                    })
                )}
            </View>

            <Text style={styles.sectionLabel}>Budgets</Text>
            <View style={styles.card}>
                {categories.map((c) => {
                    const budget = budgets.find((b) => b.categoryId === c.id);
                    return (
                        <View key={c.id} style={styles.budgetRow}>
                            <View style={styles.budgetHeader}>
                                <Text style={styles.budgetName}>{c.emoji} {c.name}</Text>
                                <Pressable onPress={() => openBudgetEditor(c.id, budget?.amount)}>
                                    <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 12.5 }}>{budget ? 'Edit' : 'Set budget'}</Text>
                                </Pressable>
                            </View>
                            {budget && (
                                <>
                                    <View style={styles.track}>
                                        <View style={[styles.fill, { width: `${Math.min(100, budget.percentage)}%`, backgroundColor: budget.isOverBudget ? colors.danger : budget.isNearLimit ? colors.warning : colors.accent }]} />
                                    </View>
                                    <Text style={styles.budgetSub}>
                                        {formatMoney(budget.spent)} / {formatMoney(budget.amount)}
                                        {budget.isOverBudget && '  ⚠️ Over budget'}
                                        {budget.isNearLimit && !budget.isOverBudget && '  ⚠️ Near limit'}
                                    </Text>
                                </>
                            )}
                        </View>
                    );
                })}
            </View>

            <Modal visible={budgetModalOpen} transparent animationType="fade" onRequestClose={() => setBudgetModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Set Monthly Budget</Text>
                        <TextInput
                            value={budgetAmount} onChangeText={(t) => setBudgetAmount(t.replace(/[^0-9.]/g, ''))}
                            keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.textMuted}
                            style={styles.modalInput} autoFocus
                        />
                        <Pressable style={[styles.modalSave, savingBudget && { opacity: 0.6 }]} onPress={handleSaveBudget} disabled={savingBudget}>
                            {savingBudget ? <ActivityIndicator color={colors.textOnAccent} /> : <Text style={styles.modalSaveText}>Save</Text>}
                        </Pressable>
                        <Pressable style={{ alignItems: 'center', marginTop: spacing.md }} onPress={() => setBudgetModalOpen(false)}>
                            <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

function getStyles(colors: any) {
    return StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
        loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
        heading: { fontSize: typography.fontSizes.xxxl, fontWeight: typography.fontWeights.extrabold, color: colors.text },
        sub: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, marginTop: 2, marginBottom: spacing.lg },
        heroCard: { backgroundColor: colors.primary, borderRadius: borderRadius.xl, padding: spacing.xl },
        heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        heroLabel: { color: colors.accentSoft, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
        heroValue: { marginTop: spacing.sm, color: colors.textOnPrimary, fontSize: 32, fontWeight: '800' },
        badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
        kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
        kpiCard: { flex: 1, minWidth: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
        kpiLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 11, textTransform: 'uppercase' },
        kpiValue: { marginTop: 4, fontSize: 17, fontWeight: '800', color: colors.text },
        kpiValueMuted: { marginTop: 4, color: colors.textMuted },
        sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: spacing.lg, marginBottom: spacing.sm },
        card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing.lg },
        dowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
        dowLabel: { width: 32, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
        dowValue: { width: 70, textAlign: 'right', fontSize: 11.5, fontWeight: '700', color: colors.textSecondary },
        track: { flex: 1, height: 7, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
        fill: { height: '100%', borderRadius: 4 },
        breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
        breakdownName: { width: 100, fontSize: 13, color: colors.text, fontWeight: '600' },
        pct: { width: 34, textAlign: 'right', fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
        emptyText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: spacing.md },
        budgetRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
        budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
        budgetName: { fontSize: 13.5, fontWeight: '700', color: colors.text },
        budgetSub: { marginTop: 4, fontSize: 11.5, color: colors.textSecondary, fontWeight: '600' },
        modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
        modalCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl },
        modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
        modalInput: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text, fontSize: 18, fontWeight: '700' },
        modalSave: { marginTop: spacing.md, backgroundColor: colors.accent, borderRadius: borderRadius.md, alignItems: 'center', paddingVertical: 12 },
        modalSaveText: { color: colors.textOnAccent, fontWeight: '800' },
    });
}