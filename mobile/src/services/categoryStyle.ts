import { CATEGORY_PALETTE, FALLBACK_STYLE } from '../constants';

type CategoryStyle = { emoji: string; color: string; tint: string };

// Same order as your original defaultCategories() in constants.ts,
// so these names keep their original look even though they now come from the backend.
const DEFAULT_NAMES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];

const NAME_STYLE_MAP: Record<string, CategoryStyle> = Object.fromEntries(
  DEFAULT_NAMES.map((name, index) => [name, CATEGORY_PALETTE[index]])
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
  return CATEGORY_PALETTE[index] ?? FALLBACK_STYLE;
}