import { create } from 'zustand';
import { getDatabase } from '@/db/database';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpenseFilters,
} from '@/db/expenses';
import type {
  CreateExpenseInput,
  Expense,
  UpdateExpenseInput,
} from '@/types';

interface ExpensesState {
  expenses: Expense[];
  selectedExpense: Expense | null;
  isLoading: boolean;
  error: string | null;
  fetchExpensesByRange: (from: string, to: string) => Promise<void>;
  fetchExpenseById: (id: number) => Promise<void>;
  createExpense: (data: CreateExpenseInput) => Promise<number>;
  updateExpense: (id: number, data: UpdateExpenseInput) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  clearSelected: () => void;
}

export const useExpensesStore = create<ExpensesState>((set) => ({
  expenses: [],
  selectedExpense: null,
  isLoading: false,
  error: null,

  fetchExpensesByRange: async (from, to) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const filters: ExpenseFilters = { from, to };
      const expenses = await getExpenses(db, filters);
      set({ expenses, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  fetchExpenseById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const expense = await getExpenseById(db, id);
      set({ selectedExpense: expense, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createExpense: async (data) => {
    const db = await getDatabase();
    const id = await createExpense(db, data);
    return id;
  },

  updateExpense: async (id, data) => {
    const db = await getDatabase();
    await updateExpense(db, id, data);
    const expense = await getExpenseById(db, id);
    set((state) => ({
      selectedExpense: expense,
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, ...data } : e
      ),
    }));
  },

  deleteExpense: async (id) => {
    const db = await getDatabase();
    await deleteExpense(db, id);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
      selectedExpense: null,
    }));
  },

  clearSelected: () => set({ selectedExpense: null }),
}));
