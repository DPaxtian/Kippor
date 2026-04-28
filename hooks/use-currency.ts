import { useUIStore } from '@/store/ui-store';
import { formatCurrency, getCurrencySymbol } from '@/utils/format';
import { useCallback } from 'react';

export function useCurrency() {
  const currency = useUIStore((s) => s.currency);
  const fmt = useCallback((value: number) => formatCurrency(value, currency), [currency]);
  const symbol = getCurrencySymbol(currency);
  return { fmt, symbol, currency };
}
