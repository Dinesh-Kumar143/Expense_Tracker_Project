import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { borderRadius, colors, spacing, typography } from '../theme';
import { Category } from '../types';
import { todayISODate } from '../utils';

/**
 * Floating Overlay Widget
 * 
 * This component represents the UI for the Android system overlay.
 * It will be rendered by the native overlay service.
 * 
 * Design: Compact, minimal UI for quick expense entry
 * - Category selector (horizontal scroll or grid)
 * - Amount input
 * - Quick save button
 * - Minimize/close button
 */

type Props = {
  categories: Category[];
  onSave: (categoryId: string, amount: number) => void;
  onClose: () => void;
};

export function FloatingOverlay({ categories, onSave, onClose }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? '',
  );
  const [amount, setAmount] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId,
  );

  function handleAmountChange(text: string) {
    // Allow only numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  }

  function handleSave() {
    const parsed = Number(amount);

    if (!amount || !Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('No Category', 'Please select a category.');
      return;
    }

    onSave(selectedCategoryId, parsed);
    
    // Reset form
    setAmount('');
    setIsExpanded(false);
  }

  // Collapsed state: Just the floating button
  if (!isExpanded) {
    return (
      <Pressable style={styles.floatingButton} onPress={() => setIsExpanded(true)}>
        <Text style={styles.floatingButtonText}>+</Text>
      </Pressable>
    );
  }

  // Expanded state: Full quick-add form
  return (
    <View style={styles.expandedContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quick Add</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerButton}
            onPress={() => setIsExpanded(false)}
            hitSlop={8}
          >
            <Text style={styles.headerButtonText}>−</Text>
          </Pressable>
          <Pressable style={styles.headerButton} onPress={onClose} hitSlop={8}>
            <Text style={styles.headerButtonText}>✕</Text>
          </Pressable>
        </View>
      </View>

      {/* Category Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.slice(0, 6).map((category) => {
            const isSelected = category.id === selectedCategoryId;
            return (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryChip,
                  isSelected && {
                    backgroundColor: category.tint,
                    borderColor: category.color,
                  },
                ]}
                onPress={() => setSelectedCategoryId(category.id)}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    isSelected && { color: category.color },
                  ]}
                  numberOfLines={1}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>Rs.</Text>
          <TextInput
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.amountInput}
            autoFocus
          />
        </View>
      </View>

      {/* Save Button */}
      <Pressable
        style={[styles.saveButton, !amount && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!amount}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Collapsed Button
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingButtonText: {
    fontSize: 32,
    color: colors.textOnAccent,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 32,
  },

  // Expanded Container
  expandedContainer: {
    width: 320,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    elevation: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    gap: spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  headerButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: typography.fontSizes.lg,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.bold,
  },

  // Section
  section: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 90,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    flex: 1,
  },

  // Amount Input
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  currencySymbol: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.text,
    padding: 0,
  },

  // Save Button
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.textOnAccent,
  },
});
