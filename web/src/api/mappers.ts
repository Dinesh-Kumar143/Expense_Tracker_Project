import type { Category, Expense, ExpenseDraft } from '../types';
import { getCategoryStyle } from '../utils/categoryStyle';

type ApiCategory = { id: string; name: string; color?: string | null; userId: string | null };
type ApiExpense = { id: string; amount: number; description?: string | null; date: string; categoryId: string };

export function mapApiCategory(apiCategory: ApiCategory): Category {
  const style = getCategoryStyle(apiCategory.name);
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    emoji: style.emoji,
    color: apiCategory.color ?? style.color,
    tint: style.tint,
    isDefault: apiCategory.userId === null,
  };
}

export function mapApiExpense(apiExpense: ApiExpense): Expense {
  return {
    id: apiExpense.id,
    title: apiExpense.description ?? '(No description)',
    amount: apiExpense.amount,
    categoryId: apiExpense.categoryId,
    date: apiExpense.date.slice(0, 10),
  };
}

export function mapDraftToApiPayload(draft: ExpenseDraft) {
  return {
    amount: Number(draft.amount),
    description: draft.title,
    date: draft.date,
    categoryId: draft.categoryId,
  };
}