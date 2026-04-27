import { create } from 'zustand';
import { colorScheme as nwColorScheme } from 'nativewind';
import type { ReportPeriod } from '@/types';

interface DateRange {
  from: string;
  to: string;
}

export type AppColorScheme = 'light' | 'dark';
export type AccentPalette = 'terracota' | 'rosa' | 'miel' | 'oliva';

interface UIState {
  reportPeriod: ReportPeriod;
  reportDateRange: DateRange;
  colorScheme: AppColorScheme;
  accentPalette: AccentPalette;
  businessName: string;
  setReportPeriod: (period: ReportPeriod) => void;
  setReportDateRange: (range: DateRange) => void;
  setColorScheme: (scheme: AppColorScheme) => void;
  toggleColorScheme: () => void;
  setAccentPalette: (palette: AccentPalette) => void;
  setBusinessName: (name: string) => void;
}

function getTodayRange(): DateRange {
  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export const useUIStore = create<UIState>((set, get) => ({
  reportPeriod: 'today',
  reportDateRange: getTodayRange(),
  colorScheme: 'light',
  accentPalette: 'terracota',
  businessName: 'Mi negocio',

  setReportPeriod: (period) => set({ reportPeriod: period }),
  setReportDateRange: (range) => set({ reportDateRange: range }),
  setColorScheme: (scheme) => {
    nwColorScheme.set(scheme);
    set({ colorScheme: scheme });
  },
  toggleColorScheme: () => {
    const next = get().colorScheme === 'light' ? 'dark' : 'light';
    nwColorScheme.set(next);
    set({ colorScheme: next });
  },
  setAccentPalette: (palette) => set({ accentPalette: palette }),
  setBusinessName: (name) => set({ businessName: name }),
}));
