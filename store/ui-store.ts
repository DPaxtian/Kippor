import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appearance } from 'react-native';
import { colorScheme as nwColorScheme } from 'nativewind';
import type { ReportPeriod } from '@/types';
import i18n, { detectDeviceLanguage, type AppLanguage } from '@/i18n';

interface DateRange {
  from: string;
  to: string;
}

export type AppColorScheme = 'light' | 'dark';
export type AccentPalette = 'terracota' | 'rosa' | 'miel' | 'oliva' | 'pizarra';
export type CurrencyCode = 'MXN' | 'USD' | 'EUR' | 'COP' | 'ARS' | 'CLP' | 'PEN' | 'GTQ' | 'CRC';
export type { AppLanguage };

export interface NotificationTime { hour: number; minute: number; }

interface UIState {
  reportPeriod: ReportPeriod;
  reportDateRange: DateRange;
  colorScheme: AppColorScheme;
  accentPalette: AccentPalette;
  businessName: string;
  currency: CurrencyCode;
  morningNotificationEnabled: boolean;
  morningNotificationTime: NotificationTime;
  eveningNotificationEnabled: boolean;
  eveningNotificationTime: NotificationTime;
  language: AppLanguage;
  setReportPeriod: (period: ReportPeriod) => void;
  setReportDateRange: (range: DateRange) => void;
  setColorScheme: (scheme: AppColorScheme) => void;
  toggleColorScheme: () => void;
  setAccentPalette: (palette: AccentPalette) => void;
  setBusinessName: (name: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setMorningNotification: (enabled: boolean, time?: NotificationTime) => void;
  setEveningNotification: (enabled: boolean, time?: NotificationTime) => void;
  setLanguage: (lang: AppLanguage) => void;
}

function getTodayRange(): DateRange {
  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

const systemScheme: AppColorScheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
nwColorScheme.set(systemScheme);

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      reportPeriod: 'today',
      reportDateRange: getTodayRange(),
      colorScheme: systemScheme,
      accentPalette: 'terracota',
      businessName: 'Mi negocio',
      currency: 'MXN',
      morningNotificationEnabled: false,
      morningNotificationTime: { hour: 9, minute: 0 },
      eveningNotificationEnabled: false,
      eveningNotificationTime: { hour: 20, minute: 0 },
      language: detectDeviceLanguage(),

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
      setCurrency: (currency) => set({ currency }),
      setMorningNotification: (enabled, time) => set((s) => ({
        morningNotificationEnabled: enabled,
        morningNotificationTime: time ?? s.morningNotificationTime,
      })),
      setEveningNotification: (enabled, time) => set((s) => ({
        eveningNotificationEnabled: enabled,
        eveningNotificationTime: time ?? s.eveningNotificationTime,
      })),
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
    }),
    {
      name: 'kippor-ui',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        colorScheme: state.colorScheme,
        accentPalette: state.accentPalette,
        businessName: state.businessName,
        currency: state.currency,
        morningNotificationEnabled: state.morningNotificationEnabled,
        morningNotificationTime: state.morningNotificationTime,
        eveningNotificationEnabled: state.eveningNotificationEnabled,
        eveningNotificationTime: state.eveningNotificationTime,
        language: state.language,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) nwColorScheme.set(state.colorScheme);
      },
    }
  )
);
