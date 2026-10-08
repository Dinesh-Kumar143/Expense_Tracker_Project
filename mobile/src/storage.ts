import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import { DATA_FILE, LEGACY_STORAGE_KEY, defaultCategories } from './constants';
import { AppData, AppSettings, Category, Expense } from './types';

function defaultSettings(): AppSettings {
  return {
    overlayEnabled: false,
    currencySymbol: 'Rs.',
  };
}

function emptyData(): AppData {
  return {
    categories: defaultCategories(),
    expenses: [],
    settings: defaultSettings(),
  };
}

function dataFile() {
  return new File(Paths.document, DATA_FILE);
}

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Category;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.emoji === 'string' &&
    typeof item.color === 'string' &&
    typeof item.tint === 'string'
  );
}

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Expense;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.amount === 'number' &&
    typeof item.categoryId === 'string' &&
    typeof item.date === 'string'
  );
}

function normalize(parsed: Partial<AppData> | Expense[]): AppData {
  const base = emptyData();

  // Handle legacy expense array format
  if (Array.isArray(parsed)) {
    return {
      ...base,
      expenses: parsed.map((item) => ({
        ...item,
        categoryId:
          (item as Expense & { category?: string }).categoryId ??
          `cat-${String((item as { category?: string }).category ?? 'other').toLowerCase()}`,
      })),
    };
  }

  // Validate and normalize categories
  const categories = Array.isArray(parsed.categories)
    ? parsed.categories.filter(isCategory)
    : base.categories;

  // Validate and normalize expenses
  const expenses = Array.isArray(parsed.expenses)
    ? parsed.expenses.filter(isExpense)
    : [];

  // Normalize settings with backward compatibility
  const settings: AppSettings = {
    overlayEnabled: parsed.settings?.overlayEnabled ?? (parsed as any).overlayEnabled ?? false,
    currencySymbol: parsed.settings?.currencySymbol ?? base.settings.currencySymbol,
  };

  return {
    categories: categories.length > 0 ? categories : base.categories,
    expenses,
    settings,
  };
}

export async function loadAppData(): Promise<AppData> {
  try {
    const file = dataFile();
    if (file.exists) {
      return normalize(JSON.parse(file.textSync()) as Partial<AppData>);
    }
  } catch {
    // Fall through to legacy storage.
  }

  try {
    const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      const migrated = normalize(parsed as Partial<AppData> | Expense[]);
      await saveAppData(migrated);
      return migrated;
    }
  } catch {
    // Ignore corrupt legacy data.
  }

  const fresh = emptyData();
  await saveAppData(fresh);
  return fresh;
}

export async function saveAppData(data: AppData): Promise<void> {
  const file = dataFile();
  if (!file.exists) {
    file.create();
  }
  file.write(JSON.stringify(data));
}

// ============================================
// CATEGORY STORE CRUD OPERATIONS
// ============================================

export async function addCategory(
  data: AppData,
  category: Category,
): Promise<AppData> {
  const updated: AppData = {
    ...data,
    categories: [...data.categories, category],
  };
  await saveAppData(updated);
  return updated;
}

export async function updateCategory(
  data: AppData,
  categoryId: string,
  updates: Partial<Omit<Category, 'id'>>,
): Promise<AppData> {
  const updated: AppData = {
    ...data,
    categories: data.categories.map((cat) =>
      cat.id === categoryId ? { ...cat, ...updates } : cat,
    ),
  };
  await saveAppData(updated);
  return updated;
}

export async function deleteCategory(
  data: AppData,
  categoryId: string,
  reassignTo?: string,
): Promise<AppData> {
  const category = data.categories.find((cat) => cat.id === categoryId);

  // Prevent deletion of default categories
  if (category?.isDefault) {
    throw new Error('Cannot delete default category');
  }

  // Check if category has associated expenses
  const hasExpenses = data.expenses.some((exp) => exp.categoryId === categoryId);

  if (hasExpenses && !reassignTo) {
    throw new Error('Category has associated expenses. Provide reassignTo categoryId.');
  }

  const updated: AppData = {
    ...data,
    categories: data.categories.filter((cat) => cat.id !== categoryId),
    expenses: hasExpenses
      ? data.expenses.map((exp) =>
        exp.categoryId === categoryId ? { ...exp, categoryId: reassignTo! } : exp,
      )
      : data.expenses,
  };

  await saveAppData(updated);
  return updated;
}

// ============================================
// EXPENSE STORE CRUD OPERATIONS
// ============================================

export async function addExpense(
  data: AppData,
  expense: Expense,
): Promise<AppData> {
  const updated: AppData = {
    ...data,
    expenses: [expense, ...data.expenses],
  };
  await saveAppData(updated);
  return updated;
}

export async function updateExpense(
  data: AppData,
  expenseId: string,
  updates: Partial<Omit<Expense, 'id'>>,
): Promise<AppData> {
  const updated: AppData = {
    ...data,
    expenses: data.expenses.map((exp) =>
      exp.id === expenseId ? { ...exp, ...updates } : exp,
    ),
  };
  await saveAppData(updated);
  return updated;
}

export async function deleteExpense(
  data: AppData,
  expenseId: string,
): Promise<AppData> {
  const updated: AppData = {
    ...data,
    expenses: data.expenses.filter((exp) => exp.id !== expenseId),
  };
  await saveAppData(updated);
  return updated;
}

// ============================================
// SETTINGS OPERATIONS
// ============================================

export async function updateSettings(
  data: AppData,
  updates: Partial<AppSettings>,
): Promise<AppData> {
  const updated: AppData = {
    ...data,
    settings: { ...data.settings, ...updates },
  };
  await saveAppData(updated);
  return updated;
}

// ============================================
// QUERY HELPERS
// ============================================

export function getExpenses(data: AppData): Expense[] {
  return data.expenses;
}

export function getCategories(data: AppData): Category[] {
  return data.categories;
}

export function getSettings(data: AppData): AppSettings {
  return data.settings;
}
