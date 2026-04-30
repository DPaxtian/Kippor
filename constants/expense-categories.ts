import type { ExpenseCategory } from '@/types';

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  supplies:  '#F97316', // naranja
  packaging: '#3B82F6', // azul
  transport: '#8B5CF6', // violeta
  equipment: '#EAB308', // amarillo
  services:  '#06B6D4', // cian
  marketing: '#EC4899', // rosa
  fees:      '#22C55E', // verde
  other:     '#6B7280', // gris
};

export interface ExpenseCategoryMeta {
  key: ExpenseCategory;
  emoji: string;
  icon: 'cart.fill' | 'shippingbox.fill' | 'car.fill' | 'wrench.and.screwdriver.fill' | 'bolt.fill' | 'megaphone.fill' | 'creditcard.fill' | 'ellipsis.circle.fill';
}

export const EXPENSE_CATEGORIES: ExpenseCategoryMeta[] = [
  { key: 'supplies',  emoji: '🛒', icon: 'cart.fill' },
  { key: 'packaging', emoji: '📦', icon: 'shippingbox.fill' },
  { key: 'transport', emoji: '🚗', icon: 'car.fill' },
  { key: 'equipment', emoji: '🔧', icon: 'wrench.and.screwdriver.fill' },
  { key: 'services',  emoji: '⚡', icon: 'bolt.fill' },
  { key: 'marketing', emoji: '📣', icon: 'megaphone.fill' },
  { key: 'fees',      emoji: '💳', icon: 'creditcard.fill' },
  { key: 'other',     emoji: '⋯',  icon: 'ellipsis.circle.fill' },
];
