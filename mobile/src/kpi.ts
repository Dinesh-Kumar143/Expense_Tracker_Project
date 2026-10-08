import { Category, Expense, KPIData } from './types';
import {
  getDaysElapsedInMonth,
  getEndOfMonth,
  getEndOfToday,
  getEndOfYear,
  getStartOfMonth,
  getStartOfToday,
  getStartOfYear,
  isDateInRange,
  isSameMonth,
  isSameYear,
  isToday,
  sumAmounts,
} from './utils';
import Logger from './logging/Logger';

// ============================================
// KPI CALCULATIONS
// ============================================

/**
 * KPI 1: Total Amount Spent (Lifetime)
 * Cumulative lifetime expenditure logged in the system
 */
export function getTotalSpent(expenses: Expense[]): number {
  return sumAmounts(expenses);
}

/**
 * KPI 2: Today's Spending
 * Total expenses recorded for the current calendar date (00:00 - 23:59)
 */
export function getTodaySpent(expenses: Expense[], now = new Date()): number {
  const todayExpenses = expenses.filter((expense) => isToday(expense.date, now));
  return sumAmounts(todayExpenses);
}

/**
 * KPI 3: Monthly Spending
 * Total expenses recorded in the current calendar month
 */
export function getMonthlySpent(expenses: Expense[], now = new Date()): number {
  const monthExpenses = expenses.filter((expense) => isSameMonth(expense.date, now));
  return sumAmounts(monthExpenses);
}

/**
 * KPI 4: Yearly Spending
 * Total expenses recorded in the current calendar year
 */
export function getYearlySpent(expenses: Expense[], now = new Date()): number {
  const yearExpenses = expenses.filter((expense) => isSameYear(expense.date, now));
  return sumAmounts(yearExpenses);
}

/**
 * KPI 5: Average Daily Spending
 * Calculated as: Current Month Spending / Days Elapsed in Current Month
 */
export function getDailyAverageSpent(
  expenses: Expense[],
  now = new Date(),
): number {
  const monthlySpent = getMonthlySpent(expenses, now);
  const daysElapsed = getDaysElapsedInMonth(now);

  if (daysElapsed === 0) {
    return 0;
  }

  return monthlySpent / daysElapsed;
}

/**
 * KPI 6 (Suggested): Top Spending Category
 * The category taking up the highest percentage of current month's expenses
 * Returns: { categoryId, amount, percentage }
 */
export function getTopCategory(
  expenses: Expense[],
  categories: Category[],
  now = new Date(),
): {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
} | null {
  const monthExpenses = expenses.filter((expense) => isSameMonth(expense.date, now));

  if (monthExpenses.length === 0) {
    return null;
  }

  // Group expenses by category
  const categoryTotals = new Map<string, number>();
  monthExpenses.forEach((expense) => {
    const current = categoryTotals.get(expense.categoryId) ?? 0;
    categoryTotals.set(expense.categoryId, current + expense.amount);
  });

  // Find category with highest spending
  let topCategoryId = '';
  let topAmount = 0;

  categoryTotals.forEach((amount, categoryId) => {
    if (amount > topAmount) {
      topAmount = amount;
      topCategoryId = categoryId;
    }
  });

  if (!topCategoryId) {
    return null;
  }

  const monthlyTotal = sumAmounts(monthExpenses);
  const percentage = monthlyTotal > 0 ? (topAmount / monthlyTotal) * 100 : 0;

  const category = categories.find((cat) => cat.id === topCategoryId);

  return {
    categoryId: topCategoryId,
    categoryName: category?.name ?? 'Unknown',
    amount: topAmount,
    percentage,
  };
}

/**
 * KPI 7 (Suggested): Daily Pace Tracker
 * Shows whether today's spending is above or below the average daily allowance
 * Returns: { todaySpent, averageDaily, difference, isAboveAverage }
 */
export function getDailyPaceTracker(
  expenses: Expense[],
  now = new Date(),
): {
  todaySpent: number;
  averageDaily: number;
  difference: number;
  isAboveAverage: boolean;
} {
  const todaySpent = getTodaySpent(expenses, now);
  const averageDaily = getDailyAverageSpent(expenses, now);
  const difference = todaySpent - averageDaily;

  return {
    todaySpent,
    averageDaily,
    difference,
    isAboveAverage: todaySpent > averageDaily,
  };
}

// ============================================
// FILTER FUNCTIONS
// ============================================

/**
 * Filter expenses by date range
 */
export function filterByDateRange(
  expenses: Expense[],
  startDate: Date,
  endDate: Date,
): Expense[] {
  return expenses.filter((expense) =>
    isDateInRange(expense.date, startDate, endDate),
  );
}

/**
 * Filter expenses by category ID
 */
export function filterByCategory(
  expenses: Expense[],
  categoryId: string,
): Expense[] {
  return expenses.filter((expense) => expense.categoryId === categoryId);
}

/**
 * Filter expenses by multiple category IDs
 */
export function filterByCategories(
  expenses: Expense[],
  categoryIds: string[],
): Expense[] {
  const categorySet = new Set(categoryIds);
  return expenses.filter((expense) => categorySet.has(expense.categoryId));
}

/**
 * Preset filter: Today's expenses
 */
export function filterToday(expenses: Expense[], now = new Date()): Expense[] {
  const start = getStartOfToday(now);
  const end = getEndOfToday(now);
  return filterByDateRange(expenses, start, end);
}

/**
 * Preset filter: This week's expenses
 */
export function filterThisWeek(expenses: Expense[], now = new Date()): Expense[] {
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
  endOfWeek.setHours(23, 59, 59, 999);

  return filterByDateRange(expenses, startOfWeek, endOfWeek);
}

/**
 * Preset filter: This month's expenses
 */
export function filterThisMonth(expenses: Expense[], now = new Date()): Expense[] {
  const start = getStartOfMonth(now);
  const end = getEndOfMonth(now);
  return filterByDateRange(expenses, start, end);
}

/**
 * Preset filter: This year's expenses
 */
export function filterThisYear(expenses: Expense[], now = new Date()): Expense[] {
  const start = getStartOfYear(now);
  const end = getEndOfYear(now);
  return filterByDateRange(expenses, start, end);
}

/**
 * Combined filter: Apply date range and category filters
 */
export function applyFilters(
  expenses: Expense[],
  options: {
    startDate?: Date;
    endDate?: Date;
    categoryIds?: string[];
  },
): Expense[] {
  let filtered = expenses;

  // Apply date range filter
  if (options.startDate && options.endDate) {
    filtered = filterByDateRange(filtered, options.startDate, options.endDate);
  }

  // Apply category filter
  if (options.categoryIds && options.categoryIds.length > 0) {
    filtered = filterByCategories(filtered, options.categoryIds);
  }

  return filtered;
}

// ============================================
// CONSOLIDATED KPI CALCULATION
// ============================================

/**
 * Calculate all KPIs at once for efficiency
 * Returns a complete KPIData object with all metrics
 */
export function calculateAllKPIs(
  expenses: Expense[],
  categories: Category[],
  now = new Date(),
): KPIData {
  const startTime = Date.now();

  const totalSpent = getTotalSpent(expenses);
  const todaySpent = getTodaySpent(expenses, now);
  const monthlySpent = getMonthlySpent(expenses, now);
  const yearlySpent = getYearlySpent(expenses, now);
  const dailyAverage = getDailyAverageSpent(expenses, now);
  const topCategory = getTopCategory(expenses, categories, now);
  const dailyPace = getDailyPaceTracker(expenses, now);

  const duration = Date.now() - startTime;

  // Log performance if calculation takes more than 10ms
  if (duration > 10) {
    Logger.logPerformance('KPI Calculation', duration, 'ms', {
      expenseCount: expenses.length,
      categoryCount: categories.length,
    });
  }

  return {
    totalSpent,
    todaySpent,
    monthlySpent,
    yearlySpent,
    dailyAverage,
    topCategory,
    dailyPace,
  };
}
