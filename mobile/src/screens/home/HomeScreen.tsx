import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExpenseModal } from '../../components/ExpenseModal';
import { ExpenseRow } from '../../components/ExpenseRow';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpensesContext';
import { getMonthlySpent } from '../../kpi';
import { formatMoney } from '../../utils';
import { Expense, ExpenseDraft } from '../../types';
import Logger from '../../logging/Logger';
import { spacing, borderRadius, typography } from '../../theme';

export function HomeScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { expenses, categories, loading, refreshing, refresh, addExpense, editExpense, removeExpense } = useExpenses();
    const styles = getStyles(colors);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Expense | null>(null);

    const monthlySpent = getMonthlySpent(expenses);
    const recent = expenses.slice(0, 20); // context loads the year; Home only shows the most recent slice

    function openAdd() { setEditing(null); setModalOpen(true); }
    function openEdit(expense: Expense) { setEditing(expense); setModalOpen(true); }

    async function handleSave(draft: ExpenseDraft) {
        try {
            if (editing) {
                await editExpense(editing.id, draft);
            } else {
                await addExpense(draft);
            }
            setModalOpen(false);
            setEditing(null);
        } catch (err: any) {
            Logger.logError('Failed to save expense', err);
            Alert.alert('Could not save', 'Something went wrong saving this expense. Try again.');
        }
    }

    async function handleDelete(id: string) {
        try {
            await removeExpense(id);
        } catch (err: any) {
            Logger.logError('Failed to delete expense', err);
        }
    }

    const renderItem = useCallback(
        ({ item }: { item: Expense }) => (
            <ExpenseRow expense={item} categories={categories} onEdit={openEdit} onDelete={handleDelete} />
        ),
        [categories]
    );

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={colors.accent} size="large" />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.kicker}>Hey, {user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
                <Text style={styles.heading}>Your spending</Text>
            </View>

            <View style={styles.balanceStrip}>
                <Text style={styles.balanceLabel}>Spent this month</Text>
                <Text style={styles.balanceValue}>{formatMoney(monthlySpent)}</Text>
            </View>

            <FlatList
                data={recent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                onRefresh={refresh}
                refreshing={refreshing}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>No expenses yet</Text>
                        <Text style={styles.emptyBody}>Tap the + button to log your first expense.</Text>
                    </View>
                }
            />

            <Pressable style={styles.fab} onPress={openAdd}>
                <Text style={styles.fabText}>+</Text>
            </Pressable>

            <ExpenseModal
                visible={modalOpen}
                expense={editing}
                categories={categories}
                floating
                onClose={() => { setModalOpen(false); setEditing(null); }}
                onSave={handleSave}
            />
        </View>
    );
}

function getStyles(colors: any) {
    return StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
        loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
        header: { marginBottom: spacing.md },
        kicker: { color: colors.primary, fontWeight: typography.fontWeights.extrabold, fontSize: typography.fontSizes.sm, letterSpacing: 0.5, textTransform: 'uppercase' },
        heading: { marginTop: 2, fontSize: typography.fontSizes.xxxl, fontWeight: typography.fontWeights.extrabold, color: colors.text },
        balanceStrip: {
            backgroundColor: colors.accent, borderRadius: borderRadius.xl, padding: spacing.lg,
            marginTop: spacing.md,
        },
        balanceLabel: { color: colors.textOnAccent, opacity: 0.85, fontWeight: typography.fontWeights.bold, fontSize: typography.fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
        balanceValue: { color: colors.textOnAccent, fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.extrabold, marginTop: 4 },
        list: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl + spacing.lg },
        fab: {
            position: 'absolute', right: spacing.lg, bottom: spacing.xl,
            width: 58, height: 58, borderRadius: 29,
            backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
            elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
        },
        fabText: { color: colors.textOnAccent, fontSize: 30, fontWeight: typography.fontWeights.extrabold, marginTop: -2 },
        empty: { paddingVertical: spacing.huge, alignItems: 'center', paddingHorizontal: spacing.xxl },
        emptyTitle: { fontSize: typography.fontSizes.lg, fontWeight: typography.fontWeights.extrabold, color: colors.text },
        emptyBody: { marginTop: spacing.sm, textAlign: 'center', color: colors.textSecondary, fontSize: typography.fontSizes.base },
    });
}