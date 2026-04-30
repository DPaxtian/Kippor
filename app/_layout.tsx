import '../global.css';
import '@/i18n';

import { Theme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { initDatabase } from '@/db/database';
import { getPaletteTokens } from '@/constants/palette';
import { useUIStore } from '@/store/ui-store';
import { OnboardingModal } from '@/components/ui/OnboardingModal';
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';

const BASE_FONTS: Theme['fonts'] = {
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  bold: { fontFamily: 'System', fontWeight: '700' },
  heavy: { fontFamily: 'System', fontWeight: '800' },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useUIStore((s) => s.colorScheme);
  const setColorScheme = useUIStore((s) => s.setColorScheme);
  const accentPalette = useUIStore((s) => s.accentPalette);
  const language = useUIStore((s) => s.language);
  const hasSeenOnboarding = useUIStore((s) => s.hasSeenOnboarding);
  const { t } = useTranslation();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((e) => console.error('Error initializing database:', e));
  }, []);

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme: sys }) => {
      setColorScheme(sys === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, [setColorScheme]);

  if (!dbReady) {
    // El splash screen permanece visible hasta que la DB esté lista
    return null;
  }

  const { color: primaryColor } = getPaletteTokens(accentPalette, colorScheme);
  const isDark = colorScheme === 'dark';

  const navTheme: Theme = {
    dark: isDark,
    colors: {
      primary: primaryColor,
      background: isDark ? '#171311' : '#FAF7F4',
      card: isDark ? '#211C19' : '#FFFFFF',
      text: isDark ? '#F4EDE7' : '#1F1815',
      border: isDark ? '#332A26' : '#E8E0D8',
      notification: primaryColor,
    },
    fonts: BASE_FONTS,
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="orders/new"
            options={{ title: t('orders.new'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="orders/[id]"
            options={{ title: t('orders.detail'), headerBackTitle: t('tabs.orders') }}
          />
          <Stack.Screen
            name="orders/edit"
            options={{ title: t('orders.edit'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="catalog/new"
            options={{ title: t('catalog.newProduct'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="catalog/[id]"
            options={{ title: t('catalog.editProduct'), headerBackTitle: t('tabs.catalog') }}
          />
          <Stack.Screen
            name="labels"
            options={{ title: t('labelsScreen.title'), headerBackTitle: t('tabs.settings') }}
          />
          <Stack.Screen
            name="expenses/new"
            options={{ title: t('expenses.new'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="expenses/[id]"
            options={{ title: t('expenses.detail'), headerBackTitle: t('tabs.expenses') }}
          />
          <Stack.Screen
            name="expenses/edit"
            options={{ title: t('expenses.edit'), presentation: 'modal' }}
          />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <OnboardingModal visible={!hasSeenOnboarding} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
