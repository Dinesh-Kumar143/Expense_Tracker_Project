export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tint: string;
  isDefault?: boolean; // Protect default categories from accidental delete
};

export type Expense = {
  id: string;
  title: string; // Used as 'remarks' field in BRD
  amount: number;
  categoryId: string;
  date: string; // ISO 8601 string (e.g. 2026-09-21T10:00:00Z)
};

export type ExpenseDraft = {
  title: string;
  amount: string;
  categoryId: string;
  date: string;
};

export type AppSettings = {
  overlayEnabled: boolean;
  currencySymbol: string;
};

export type AppData = {
  categories: Category[];
  expenses: Expense[];
  settings: AppSettings;
};

// ============================================
// KPI TYPES
// ============================================

export type TopCategoryKPI = {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
} | null;

export type DailyPaceKPI = {
  todaySpent: number;
  averageDaily: number;
  difference: number;
  isAboveAverage: boolean;
};

export type KPIData = {
  totalSpent: number;
  todaySpent: number;
  monthlySpent: number;
  yearlySpent: number;
  dailyAverage: number;
  topCategory: TopCategoryKPI;
  dailyPace: DailyPaceKPI;
};
