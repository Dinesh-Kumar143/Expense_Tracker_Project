import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, spacing, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { KPIData } from '../types';
import { formatMoney } from '../utils';

type Props = { kpis: KPIData };

export function SummaryCards({ kpis }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { totalSpent, todaySpent, monthlySpent, yearlySpent, dailyAverage, topCategory, dailyPace } = kpis;

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>Today's Spending</Text>
          {dailyPace.isAboveAverage && (
            <View style={styles.badge}><Text style={styles.badgeText}>Above Avg</Text></View>
          )}
        </View>
        <Text style={styles.heroValue}>{formatMoney(todaySpent)}</Text>
        <View style={styles.heroFooter}>
          <Text style={styles.heroHint}>Daily avg: {formatMoney(dailyAverage)}</Text>
          {dailyPace.difference !== 0 && (
            <Text style={[styles.heroHint, dailyPace.isAboveAverage ? styles.heroHintDanger : styles.heroHintSuccess]}>
              {dailyPace.isAboveAverage ? '+' : ''}{formatMoney(Math.abs(dailyPace.difference))}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.grid}>
        <View style={[styles.card, styles.cardPrimary]}>
          <Text style={styles.cardLabel}>This Month</Text>
          <Text style={styles.cardValue}>{formatMoney(monthlySpent)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>This Year</Text>
          <Text style={styles.cardValue}>{formatMoney(yearlySpent)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>All Time</Text>
          <Text style={styles.cardValue}>{formatMoney(totalSpent)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Top Category</Text>
          {topCategory ? (
            <>
              <Text style={styles.cardValue} numberOfLines={1}>{topCategory.categoryName}</Text>
              <Text style={styles.cardHint}>{topCategory.percentage.toFixed(0)}% of month</Text>
            </>
          ) : (
            <Text style={styles.cardValueMuted}>No data</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { gap: spacing.md, marginBottom: spacing.lg },
    heroCard: { backgroundColor: colors.primary, borderRadius: borderRadius.xl, padding: spacing.xl },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroLabel: { color: colors.accentSoft, fontWeight: typography.fontWeights.bold, fontSize: typography.fontSizes.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
    badge: { backgroundColor: colors.dangerSoft, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
    badgeText: { color: colors.danger, fontSize: typography.fontSizes.xs, fontWeight: typography.fontWeights.bold },
    heroValue: { marginTop: spacing.sm, color: colors.textOnPrimary, fontSize: typography.fontSizes.huge, fontWeight: typography.fontWeights.extrabold, letterSpacing: -0.5 },
    heroFooter: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroHint: { color: colors.accentSoft, fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.medium },
    heroHintDanger: { color: '#FCA5A5' },
    heroHintSuccess: { color: '#86EFAC' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    card: { flex: 1, minWidth: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    cardPrimary: { borderColor: colors.accent, borderWidth: 1.5 },
    cardLabel: { color: colors.textSecondary, fontWeight: typography.fontWeights.bold, fontSize: typography.fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
    cardValue: { marginTop: spacing.xs, fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.extrabold, color: colors.text },
    cardValueMuted: { marginTop: spacing.xs, fontSize: typography.fontSizes.md, fontWeight: typography.fontWeights.semibold, color: colors.textMuted },
    cardHint: { marginTop: 2, fontSize: typography.fontSizes.xs, color: colors.textSecondary, fontWeight: typography.fontWeights.medium },
  });
}