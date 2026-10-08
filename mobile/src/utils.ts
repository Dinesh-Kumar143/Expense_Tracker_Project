import { CATEGORY_PALETTE, FALLBACK_STYLE } from './constants';
import { Category, Expense } from './types';

// ============================================
// MONEY FORMATTING
// ============================================

export function formatMoney(amount: number, currencySymbol = 'Rs.'): string {
  return `${currencySymbol}${amount.toFixed(2)}`;
}

// ============================================
// DATE UTILITIES
// ============================================

export function todayISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Get start of today at 00:00:00
export function getStartOfToday(now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

// Get end of today at 23:59:59
export function getEndOfToday(now = new Date()): Date {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Get start of current month at 00:00:00 on the 1st
export function getStartOfMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

// Get end of current month at 23:59:59 on the last day
export function getEndOfMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

// Get start of current year at 00:00:00 on Jan 1
export function getStartOfYear(now = new Date()): Date {
  return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
}

// Get end of current year at 23:59:59 on Dec 31
export function getEndOfYear(now = new Date()): Date {
  return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
}

// Convert ISO date string (YYYY-MM-DD) to Date object
export function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Check if date string is within date range
export function isDateInRange(
  isoDate: string,
  startDate: Date,
  endDate: Date,
): boolean {
  const date = parseISODate(isoDate);
  return date >= startDate && date <= endDate;
}

// Check if date string is today
export function isToday(isoDate: string, now = new Date()): boolean {
  const start = getStartOfToday(now);
  const end = getEndOfToday(now);
  return isDateInRange(isoDate, start, end);
}

// Check if date string is in current month
export function isSameMonth(isoDate: string, now = new Date()): boolean {
  const [year, month] = isoDate.split('-').map(Number);
  return year === now.getFullYear() && month === now.getMonth() + 1;
}

// Check if date string is in current year
export function isSameYear(isoDate: string, now = new Date()): boolean {
  const [year] = isoDate.split('-').map(Number);
  return year === now.getFullYear();
}

// Get number of days elapsed in current month (including today)
export function getDaysElapsedInMonth(now = new Date()): number {
  return now.getDate();
}

// ============================================
// EXPENSE AGGREGATION
// ============================================

export function sumAmounts(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function createId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function findCategory(
  categories: Category[],
  categoryId: string,
): Category {
  return (
    categories.find((category) => category.id === categoryId) ?? {
      id: categoryId,
      name: 'Unknown',
      ...FALLBACK_STYLE,
    }
  );
}

export function nextPalette(index: number) {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}
