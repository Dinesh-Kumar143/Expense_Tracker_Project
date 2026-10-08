import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, Pressable, ScrollView,
    StyleSheet, Text, TextInput, View,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ExpenseRow } from '../../components/ExpenseRow';
import { ExpenseModal } from '../../components/ExpenseModal';
import { useTheme } from '../../theme/ThemeContext';
import { useExpenses } from '../../context/ExpensesContext';
import { fetchExpenses } from '../../services/expenses';
import { mapApiExpense } from '../../services/mappers';
import { formatDisplayDate } from '../../utils';
import { Expense, ExpenseDraft } from '../../types';
import Logger from '../../logging/Logger';
import { spacing, borderRadius, typography } from '../../theme';

type RangeFilter = 'month' | 'lastMonth' | 'year' | 'all';

function toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getRangeDates(range: RangeFilter): { from?: string; to?: string } {
    const now = new Date();
    if (range === 'month') {
        return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISODate(now) };
    }
    if (range === 'lastMonth') {
        const to = new Date(now.getFullYear(), now.getMonth(), 0);
        const from = new Date(to.getFullYear(), to.getMonth(), 1);
        return { from: toISODate(from), to: toISODate(to) };
    }
    if (range === 'year') {
        return { from: toISODate(new Date(now.getFullYear(), 0, 1)), to: toISODate(now) };
    }
    return {}; // 'all'
}

function groupByDate(expenses: Expense[]): { title: string; data: Expense[] }[] {
    const groups = new Map<string, Expense[]>();
    expenses.forEach((e) => {
        const list = groups.get(e.date) ?? [];
        list.push(e);
        groups.set(e.date, list);
    });

    const todayISO = toISODate(new Date());
    const yesterdayISO = toISODate(new Date(Date.now() - 86400000));

    return Array.from(groups.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, data]) => ({
            title: date === todayISO ? 'Today' : date === yesterdayISO ? 'Yesterday' : formatDisplayDate(date),
            data,
        }));
}

export function ReportsScreen() {
    const { colors } = useTheme();
    const { categories, editExpense, removeExpense } = useExpenses();
    const styles = getStyles(colors);

    const [range, setRange] = useState<RangeFilter>('month');
    const [categoryId, setCategoryId] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [results, setResults] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Expense | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        load();
    }, [range, categoryId, debouncedSearch]);

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
        } catch (err: any) {
            Logger.logError('Failed to load report data', err);
        } finally {
            setLoading(false);
        }
    }

    const grouped = useMemo(() => groupByDate(results), [results]);
    const total = useMemo(() => results.reduce((sum, e) => sum + e.amount, 0), [results]);

    function openEdit(expense: Expense) { setEditing(expense); setModalOpen(true); }

    async function handleSave(draft: ExpenseDraft) {
        if (!editing) return;
        try {
            await editExpense(editing.id, draft);
            setModalOpen(false);
            setEditing(null);
            load(); // refresh this screen's own filtered results too
        } catch (err: any) {
            Alert.alert('Could not save', 'Something went wrong. Try again.');
        }
    }

    async function handleDelete(id: string) {
        try {
            await removeExpense(id);
            setResults((prev) => prev.filter((e) => e.id !== id));
        } catch (err: any) {
            Logger.logError('Failed to delete expense', err);
        }
    }

    async function handleExport() {
        if (results.length === 0) {
            Alert.alert('Nothing to export', 'No expenses match the current filters.');
            return;
        }
        setExporting(true);
        try {
            function sanitizeCsvField(value: string): string {
                return /^[=+\-@]/.test(value) ? `'${value}` : value;
            }
            const header = 'Date,Category,Description,Amount\n';
            const rows = results.map((e) => {
                const cat = sanitizeCsvField(categories.find((c) => c.id === e.categoryId)?.name ?? 'Unknown');
                const safeTitle = sanitizeCsvField(e.title).replace(/"/g, '""');
                return `${e.date},${cat},"${safeTitle}",${e.amount.toFixed(2)}`;
            });
            const csv = header + rows.join('\n');

            const file = new File(Paths.document, `expenses-${Date.now()}.csv`);
            if (!file.exists) file.create();
            file.write(csv);

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export expenses' });
            } else {
                Alert.alert('Saved', `File saved at ${file.uri}`);
            }
        } catch (err: any) {
            Logger.logError('Failed to export CSV', err);
            Alert.alert('Export failed', 'Could not generate the CSV file.');
        } finally {
            setExporting(false);
        }
    }

    const rangeOptions: { key: RangeFilter; label: string }[] = [
        { key: 'month', label: 'This month' },
        { key: 'lastMonth', label: 'Last month' },
        { key: 'year', label: 'This year' },
        { key: 'all', label: 'All time' },
    ];

    return (
        <View style={styles.screen}>
            <Text style={styles.heading}>Reports</Text>
            <Text style={styles.sub}>Search and filter your history</Text>

            <View style={styles.searchBox}>
                <Text style={{ fontSize: 14 }}>🔍</Text>
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search expenses..."
                    placeholderTextColor={colors.textMuted}
                    style={styles.searchInput}
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {rangeOptions.map((opt) => (
                    <Pressable
                        key={opt.key}
                        onPress={() => setRange(opt.key)}
                        style={[styles.chip, range === opt.key && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, range === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                <Pressable
                    onPress={() => setCategoryId('all')}
                    style={[styles.chip, categoryId === 'all' && styles.chipActive]}
                >
                    <Text style={[styles.chipText, categoryId === 'all' && styles.chipTextActive]}>All categories</Text>
                </Pressable>
                {categories.map((c) => (
                    <Pressable
                        key={c.id}
                        onPress={() => setCategoryId(c.id)}
                        style={[styles.chip, categoryId === c.id && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.emoji} {c.name}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            {loading ? (
                <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
            ) : (
                <FlatList
                    data={grouped}
                    keyExtractor={(g) => g.title}
                    ListHeaderComponent={
                        <Text style={styles.totalLine}>Total: {total.toFixed(2)} · {results.length} expense{results.length !== 1 ? 's' : ''}</Text>
                    }
                    ListEmptyComponent={<Text style={styles.emptyText}>No expenses match these filters.</Text>}
                    renderItem={({ item: group }) => (
                        <View>
                            <Text style={styles.dateGroupLabel}>{group.title}</Text>
                            {group.data.map((expense) => (
                                <View key={expense.id} style={{ marginBottom: spacing.sm }}>
                                    <ExpenseRow expense={expense} categories={categories} onEdit={openEdit} onDelete={handleDelete} />
                                </View>
                            ))}
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: spacing.xxxl }}
                />
            )}

            <Pressable style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
                {exporting ? (
                    <ActivityIndicator color={colors.textSecondary} />
                ) : (
                    <Text style={styles.exportBtnText}>⬇ Export as CSV</Text>
                )}
            </Pressable>

            <ExpenseModal
                visible={modalOpen}
                expense={editing}
                categories={categories}
                onClose={() => { setModalOpen(false); setEditing(null); }}
                onSave={handleSave}
            />
        </View>
    );
}

function getStyles(colors: any) {
    return StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
        heading: { fontSize: typography.fontSizes.xxxl, fontWeight: typography.fontWeights.extrabold, color: colors.text },
        sub: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, marginTop: 2, marginBottom: spacing.md },
        searchBox: {
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
            borderRadius: borderRadius.round, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
            marginBottom: spacing.sm,
        },
        searchInput: { flex: 1, color: colors.text, fontSize: 13.5 },
        chipRow: { flexGrow: 0, marginBottom: spacing.sm },
        chip: {
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
            borderRadius: borderRadius.round, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8,
        },
        chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
        chipText: { fontSize: 12.5, fontWeight: typography.fontWeights.bold, color: colors.textSecondary },
        chipTextActive: { color: colors.accent },
        totalLine: { fontSize: 12.5, fontWeight: typography.fontWeights.semibold, color: colors.textSecondary, marginBottom: spacing.sm },
        dateGroupLabel: { fontSize: 12, fontWeight: typography.fontWeights.bold, color: colors.textSecondary, marginTop: spacing.md, marginBottom: 8 },
        emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
        exportBtn: {
            padding: 13, borderRadius: borderRadius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border,
            alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.sm,
        },
        exportBtnText: { color: colors.textSecondary, fontWeight: typography.fontWeights.bold, fontSize: 13 },
    });
}