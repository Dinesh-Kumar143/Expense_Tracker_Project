import { memo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { borderRadius, spacing, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { Category, Expense } from '../types';
import { findCategory, formatDisplayDate, formatMoney } from '../utils';

type Props = {
  expense: Expense;
  categories: Category[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
};

function ExpenseRowComponent({ expense, categories, onEdit, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const category = findCategory(categories, expense.categoryId);

  function confirmDelete() {
    Alert.alert('Delete expense', `Remove "${expense.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(expense.id) },
    ]);
  }

  function renderRightActions() {
    return (
      <View style={styles.swipeActions}>
        <Pressable style={[styles.swipeAction, { backgroundColor: colors.info }]} onPress={() => onEdit(expense)}>
          <Text style={styles.swipeActionText}>Edit</Text>
        </Pressable>
        <Pressable style={[styles.swipeAction, { backgroundColor: colors.danger }]} onPress={confirmDelete}>
          <Text style={styles.swipeActionText}>Delete</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable style={styles.row} onPress={() => onEdit(expense)}>
        <View style={[styles.icon, { backgroundColor: category.tint }]}>
          <Text style={styles.emoji}>{category.emoji}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
          <Text style={styles.subtitle}>{category.name} · {formatDisplayDate(expense.date)}</Text>
        </View>
        <Text style={styles.amount}>{formatMoney(expense.amount)}</Text>
      </Pressable>
    </Swipeable>
  );
}

export const ExpenseRow = memo(ExpenseRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.expense.id === nextProps.expense.id &&
    prevProps.expense.title === nextProps.expense.title &&
    prevProps.expense.amount === nextProps.expense.amount &&
    prevProps.expense.categoryId === nextProps.expense.categoryId &&
    prevProps.expense.date === nextProps.expense.date &&
    prevProps.categories.length === nextProps.categories.length
  );
});

function getStyles(colors: any) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.md,
      borderWidth: 1, borderColor: colors.border,
    },
    icon: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 22 },
    meta: { flex: 1 },
    title: { fontSize: typography.fontSizes.md, fontWeight: typography.fontWeights.bold, color: colors.text },
    subtitle: { marginTop: 2, color: colors.textSecondary, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium },
    amount: { fontWeight: typography.fontWeights.extrabold, fontSize: typography.fontSizes.md, color: colors.text },
    swipeActions: { flexDirection: 'row', alignItems: 'stretch' },
    swipeAction: { justifyContent: 'center', alignItems: 'center', width: 72, borderRadius: borderRadius.lg, marginLeft: 8 },
    swipeActionText: { color: '#fff', fontWeight: typography.fontWeights.bold, fontSize: 12.5 },
  });
}