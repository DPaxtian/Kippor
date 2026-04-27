import '../global.css';

import { Theme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { initDatabase } from '@/db/database';
import { getPaletteTokens } from '@/constants/palette';
import { useUIStore } from '@/store/ui-store';

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
  const accentPalette = useUIStore((s) => s.accentPalette);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((e) => console.error('Error initializing database:', e));
  }, []);

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
            options={{ title: 'Nuevo pedido', presentation: 'modal' }}
          />
          <Stack.Screen
            name="orders/[id]"
            options={{ title: 'Pedido', headerBackTitle: 'Pedidos' }}
          />
          <Stack.Screen
            name="catalog/new"
            options={{ title: 'Nuevo producto', presentation: 'modal' }}
          />
          <Stack.Screen
            name="catalog/[id]"
            options={{ title: 'Editar producto', headerBackTitle: 'Catálogo' }}
          />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
