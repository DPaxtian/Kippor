import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export function formatCurrency(value: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  MXN: '$', USD: '$', EUR: '€', COP: '$', ARS: '$', CLP: '$', PEN: 'S/', GTQ: 'Q', CRC: '₡',
};

export function getCurrencySymbol(currency = 'MXN'): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatDate(isoString: string, locale: Locale = es, dateFormat = "d 'de' MMMM, yyyy"): string {
  return format(new Date(isoString), dateFormat, { locale });
}

export function formatDateTime(isoString: string, locale: Locale = es): string {
  return format(new Date(isoString), "d MMM · HH:mm", { locale });
}

export function formatShortDate(isoString: string): string {
  return format(new Date(isoString), 'dd/MM/yyyy', { locale: es });
}
