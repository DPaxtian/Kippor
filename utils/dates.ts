import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { ReportPeriod } from '@/types';

export interface DateRange {
  from: string;
  to: string;
}

export function getDateRange(period: ReportPeriod, custom?: DateRange): DateRange {
  const now = new Date();

  switch (period) {
    case 'today':
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
      };
    case 'week':
      return {
        from: startOfWeek(now, { locale: es }).toISOString(),
        to: endOfWeek(now, { locale: es }).toISOString(),
      };
    case 'month':
      return {
        from: startOfMonth(now).toISOString(),
        to: endOfMonth(now).toISOString(),
      };
    case 'year':
      return {
        from: startOfYear(now).toISOString(),
        to: endOfYear(now).toISOString(),
      };
    case 'custom':
      return custom ?? { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
    default:
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
      };
  }
}
