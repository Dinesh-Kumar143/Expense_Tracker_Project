import { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { borderRadius, spacing, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { Category, Expense, ExpenseDraft } from '../types';
import { todayISODate } from '../utils';
import { CategoryChips } from './CategoryChips';
import Logger from '../logging/Logger';

type Props = {
  visible: boolean;
  expense?: Expense | null;
  categories: Category[];
  defaultCategoryId?: string;
  floating?: boolean;
  onClose: () => void;
  onSave: (draft: ExpenseDraft) => void;
};

export function ExpenseModal({ visible, expense, categories, defaultCategoryId, floating = false, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const fallbackCategoryId = defaultCategoryId ?? categories[0]?.id ?? '';
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(fallbackCategoryId);
  const [date, setDate] = useState(todayISODate());

  const heading = expense ? 'Edit expense' : 'Add expense';
  const isEditing = Boolean(expense);

  useEffect(() => {
    if (!visible) return;
    setTitle(expense?.title ?? '');
    setAmount(expense ? String(expense.amount) : '');
    setCategoryId(expense?.categoryId ?? fallbackCategoryId);
    setDate(expense?.date ?? todayISODate());
  }, [visible, expense, fallbackCategoryId]);

  function handleAmountChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  }

  function handleSave() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      Alert.alert('Missing title', 'Add a short description for this expense.');
      Logger.logUserAction('Form Validation Failed', 'ExpenseModal', { reason: 'missing_title' });
      return;
    }
    if (trimmedTitle.length > 100) {
      Alert.alert('Title too long', 'Please keep the title under 100 characters.');
      Logger.logUserAction('Form Validation Failed', 'ExpenseModal', { reason: 'title_too_long', length: trimmedTitle.length });
      return;
    }

    const parsed = Number(amount);
    if (!amount || !Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Enter a number greater than zero.');
      Logger.logUserAction('Form Validation Failed', 'ExpenseModal', { reason: 'invalid_amount', value: amount });
      return;
    }
    if (parsed > 10000000) {
      Alert.alert('Amount too large', 'Please enter a reasonable amount.');
      Logger.logUserAction('Form Validation Failed', 'ExpenseModal', { reason: 'amount_too_large', value: parsed });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD format, for example 2026-09-21.');
      Logger.logUserAction('Form Validation Failed', 'ExpenseModal', { reason: 'invalid_date_format', value: date });
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      Alert.alert('Future date', 'Cannot add expenses for future dates.');
      Logger.logUserAction('Form Validation Failed', 'ExpenseModal', { reason: 'future_date', value: date });
      return;
    }
    if (!categoryId) {
      Alert.alert('No category selected', 'Please select a category for this expense.');
      Logger.logUserAction('Form Validation Failed', 'ExpenseModal', { reason: 'no_category' });
      return;
    }

    Logger.logFormSubmit('ExpenseModal', true, { action: isEditing ? 'edit' : 'add', amount: parsed, category: categoryId });

    onSave({ title: trimmedTitle, amount: parsed.toFixed(2), categoryId, date });

    if (!isEditing) {
      setTitle('');
      setAmount('');
      setCategoryId(fallbackCategoryId);
      setDate(todayISODate());
    }
  }

  const quickAmounts = [50, 100, 200, 500];
  function setQuickAmount(value: number) { setAmount(String(value)); }
  const canSave = title.trim() && amount && categoryId;

  return (
    <Modal visible={visible} animationType={floating ? 'fade' : 'slide'} transparent={floating} onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={[styles.screen, floating && styles.floatScreen]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.card, floating && styles.floatCard]}>
          <View style={styles.header}>
            <Text style={styles.title}>{heading}</Text>
            <Pressable onPress={onClose} hitSlop={12}><Text style={styles.close}>✕</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View>
              <Text style={styles.label}>Category *</Text>
              <CategoryChips categories={categories} value={categoryId} onChange={setCategoryId} />
            </View>

            <View>
              <Text style={styles.label}>Amount *</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>Rs.</Text>
                <TextInput
                  value={amount} onChangeText={handleAmountChange}
                  placeholder="0.00" placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad" style={styles.amountInput}
                  autoFocus={!isEditing} selectTextOnFocus
                />
              </View>
              <View style={styles.quickAmounts}>
                {quickAmounts.map((value) => (
                  <Pressable key={value} style={styles.quickButton} onPress={() => setQuickAmount(value)}>
                    <Text style={styles.quickButtonText}>Rs.{value}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text style={styles.label}>Description * <Text style={styles.labelHint}>(max 100 chars)</Text></Text>
              <TextInput
                value={title} onChangeText={setTitle}
                placeholder="Coffee, groceries, fuel, etc." placeholderTextColor={colors.textMuted}
                style={styles.input} maxLength={100} returnKeyType="done"
              />
              {title.length > 80 && <Text style={styles.charCount}>{title.length}/100</Text>}
            </View>

            <View>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                value={date} onChangeText={setDate}
                placeholder={todayISODate()} placeholderTextColor={colors.textMuted}
                style={styles.input} autoCapitalize="none" keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.inputHint}>Leave as today's date or change to a past date</Text>
            </View>

            <Pressable style={[styles.save, !canSave && styles.saveDisabled]} onPress={handleSave} disabled={!canSave}>
              <Text style={styles.saveText}>{isEditing ? 'Update expense' : 'Save expense'}</Text>
            </Pressable>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? 36 : 56 },
    floatScreen: { backgroundColor: colors.overlay, paddingTop: 0, justifyContent: 'flex-end', paddingHorizontal: 0 },
    card: { flex: 1, backgroundColor: colors.background },
    floatCard: { flex: 0, maxHeight: '92%', backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, overflow: 'hidden' },
    header: {
      paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
    },
    title: { fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.extrabold, color: colors.text },
    close: { color: colors.textSecondary, fontSize: typography.fontSizes.xxl, fontWeight: typography.fontWeights.medium, width: 32, height: 32, textAlign: 'center', lineHeight: 32 },
    content: { padding: spacing.xl, paddingBottom: spacing.xxxl + spacing.lg, gap: spacing.xl },
    label: { marginBottom: spacing.sm, fontWeight: typography.fontWeights.bold, fontSize: typography.fontSizes.sm, color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
    labelHint: { textTransform: 'none', fontSize: typography.fontSizes.xs, color: colors.textMuted, fontWeight: typography.fontWeights.medium },
    input: {
      backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, fontSize: typography.fontSizes.md,
      color: colors.text, fontWeight: typography.fontWeights.medium,
    },
    amountContainer: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderWidth: 2, borderColor: colors.accent, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg,
    },
    currencySymbol: { fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.textSecondary, marginRight: spacing.xs },
    amountInput: { flex: 1, paddingVertical: spacing.md + 2, fontSize: typography.fontSizes.xxl, color: colors.text, fontWeight: typography.fontWeights.extrabold },
    quickAmounts: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    quickButton: { flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
    quickButtonText: { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold, color: colors.textSecondary },
    charCount: { marginTop: spacing.xs, fontSize: typography.fontSizes.xs, color: colors.textMuted, textAlign: 'right' },
    inputHint: { marginTop: spacing.xs, fontSize: typography.fontSizes.xs, color: colors.textMuted, lineHeight: typography.fontSizes.xs * typography.lineHeights.relaxed },
    save: { marginTop: spacing.md, backgroundColor: colors.accent, borderRadius: borderRadius.lg, alignItems: 'center', paddingVertical: spacing.lg },
    saveDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
    saveText: { color: colors.textOnAccent, fontWeight: typography.fontWeights.extrabold, fontSize: typography.fontSizes.md },
    cancel: { alignItems: 'center', paddingVertical: spacing.md },
    cancelText: { color: colors.textSecondary, fontWeight: typography.fontWeights.semibold, fontSize: typography.fontSizes.base },
  });
}