type CategoryStyle = { emoji: string; color: string; tint: string };

export const CATEGORY_PALETTE: CategoryStyle[] = [
  { emoji: '🍽️', color: '#EA580C', tint: '#FFEDD5' }, // Food
  { emoji: '🚌', color: '#2563EB', tint: '#DBEAFE' }, // Transport
  { emoji: '🛍️', color: '#7C3AED', tint: '#EDE9FE' }, // Shopping
  { emoji: '💡', color: '#CA8A04', tint: '#FEF9C3' }, // Bills
  { emoji: '💊', color: '#DC2626', tint: '#FEE2E2' }, // Health
  { emoji: '🎬', color: '#DB2777', tint: '#FCE7F3' }, // Entertainment
  { emoji: '📦', color: '#475569', tint: '#E2E8F0' }, // Other
];

const DEFAULT_NAMES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];
const NAME_STYLE_MAP: Record<string, CategoryStyle> = Object.fromEntries(
  DEFAULT_NAMES.map((name, i) => [name, CATEGORY_PALETTE[i]])
);

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getCategoryStyle(name: string): CategoryStyle {
  if (NAME_STYLE_MAP[name]) return NAME_STYLE_MAP[name];
  const index = hashString(name) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[index] ?? CATEGORY_PALETTE[6];
}