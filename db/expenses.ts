import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  CreateExpenseInput,
  Expense,
  ExpenseCategory,
  ExpenseCategoryStat,
  ExpenseSummary,
  UpdateExpenseInput,
} from '@/types';

export interface ExpenseFilters {
  from?: string;       // ISO 8601
  to?: string;         // ISO 8601
  category?: ExpenseCategory;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getExpenses(
  db: SQLiteDatabase,
  filters?: ExpenseFilters
): Promise<Expense[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters?.from && filters?.to) {
    conditions.push('date >= ? AND date <= ?');
    params.push(filters.from, filters.to);
  }
  if (filters?.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.getAllAsync<Expense>(
    `SELECT * FROM expenses ${where} ORDER BY date DESC, created_at DESC`,
    params
  );
}

export async function getExpenseById(
  db: SQLiteDatabase,
  id: number
): Promise<Expense | null> {
  return db.getFirstAsync<Expense>('SELECT * FROM expenses WHERE id = ?', [id]);
}

export async function getExpenseSummary(
  db: SQLiteDatabase,
  from: string,
  to: string
): Promise<ExpenseSummary> {
  const [totalRow, categoryRows] = await Promise.all([
    db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(amount) AS total FROM expenses WHERE date >= ? AND date <= ?`,
      [from, to]
    ),
    db.getAllAsync<{ category: ExpenseCategory; total: number }>(
      `SELECT category, SUM(amount) AS total
       FROM expenses
       WHERE date >= ? AND date <= ?
       GROUP BY category
       ORDER BY total DESC`,
      [from, to]
    ),
  ]);

  return {
    totalExpenses: totalRow?.total ?? 0,
    byCategory: categoryRows as ExpenseCategoryStat[],
  };
}

// ─── Mutaciones ───────────────────────────────────────────────────────────────

export async function createExpense(
  db: SQLiteDatabase,
  data: CreateExpenseInput
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO expenses (amount, category, date, notes, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.amount,
      data.category,
      data.date,
      data.notes ?? null,
      new Date().toISOString(),
    ]
  );
  return result.lastInsertRowId;
}

export async function updateExpense(
  db: SQLiteDatabase,
  id: number,
  data: UpdateExpenseInput
): Promise<void> {
  await db.runAsync(
    `UPDATE expenses
     SET amount   = COALESCE(?, amount),
         category = COALESCE(?, category),
         date     = COALESCE(?, date),
         notes    = ?
     WHERE id = ?`,
    [
      data.amount ?? null,
      data.category ?? null,
      data.date ?? null,
      data.notes !== undefined ? data.notes : null,
      id,
    ]
  );
}

export async function deleteExpense(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}
