import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, spacing, typography } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { Category } from '../types';

type Props = {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
};

export function CategoryChips({ categories, value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.wrap}>
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <Pressable
            key={category.id}
            onPress={() => onChange(category.id)}
            style={[
              styles.chip,
              selected && { backgroundColor: category.tint, borderColor: category.color, borderWidth: 1.5 },
            ]}
          >
            <Text style={styles.emoji}>{category.emoji}</Text>
            <Text style={[styles.label, selected && { color: category.color, fontWeight: typography.fontWeights.bold }]}>
              {category.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.round,
    },
    emoji: { fontSize: typography.fontSizes.base },
    label: { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.semibold, color: colors.textSecondary },
  });
}