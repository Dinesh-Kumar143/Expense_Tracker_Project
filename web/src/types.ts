export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tint: string;
  isDefault: boolean;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
};

export type ExpenseDraft = {
  title: string;
  amount: string;
  categoryId: string;
  date: string;
};