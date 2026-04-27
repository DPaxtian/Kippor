import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(isoString: string): string {
  return format(new Date(isoString), "d 'de' MMMM, yyyy", { locale: es });
}

export function formatDateTime(isoString: string): string {
  return format(new Date(isoString), "d MMM · HH:mm", { locale: es });
}

export function formatShortDate(isoString: string): string {
  return format(new Date(isoString), 'dd/MM/yyyy', { locale: es });
}
