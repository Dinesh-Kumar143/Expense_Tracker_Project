import { Category } from './types';

export const DATA_FILE = 'expense-data.json';
export const LEGACY_STORAGE_KEY = 'expense-tracker:v1';

export const CATEGORY_PALETTE: Array<Pick<Category, 'emoji' | 'color' | 'tint'>> = [
  { emoji: '🍽️', color: '#EA580C', tint: '#FFEDD5' },
  { emoji: '🚌', color: '#2563EB', tint: '#DBEAFE' },
  { emoji: '🛍️', color: '#7C3AED', tint: '#EDE9FE' },
  { emoji: '💡', color: '#CA8A04', tint: '#FEF9C3' },
  { emoji: '💊', color: '#DC2626', tint: '#FEE2E2' },
  { emoji: '🎬', color: '#DB2777', tint: '#FCE7F3' },
  { emoji: '📦', color: '#475569', tint: '#E2E8F0' },
  { emoji: '🏠', color: '#0F766E', tint: '#CCFBF1' },
  { emoji: '🎓', color: '#4338CA', tint: '#E0E7FF' },
  { emoji: '✈️', color: '#0284C7', tint: '#E0F2FE' },
];

export const EMOJI_CHOICES = CATEGORY_PALETTE.map((item) => item.emoji);

export function defaultCategories(): Category[] {
  const names = [
    'Food',
    'Transport',
    'Shopping',
    'Bills',
    'Health',
    'Entertainment',
    'Other',
  ];

  return names.map((name, index) => ({
    id: `cat-${name.toLowerCase()}`,
    name,
    isDefault: true, // Mark as default category (protected from deletion)
    ...CATEGORY_PALETTE[index],
  }));
}

export const FALLBACK_STYLE = CATEGORY_PALETTE[6];
