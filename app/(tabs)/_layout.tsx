import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getPaletteTokens } from '@/constants/palette';
import { useUIStore } from '@/store/ui-store';

export default function TabLayout() {
  const { t } = useTranslation();
  const colorScheme = useUIStore((s) => s.colorScheme);
  const accentPalette = useUIStore((s) => s.accentPalette);
  const isDark = colorScheme === 'dark';
  const { color: primaryColor } = getPaletteTokens(accentPalette, colorScheme);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: isDark ? '#7A6E66' : '#9A8A80',
        tabBarStyle: {
          backgroundColor: isDark ? '#211C19' : '#FFFFFF',
          borderTopColor: isDark ? '#332A26' : '#E8E0D8',
        },
        headerStyle: {
          backgroundColor: isDark ? '#211C19' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#F4EDE7' : '#1F1815',
        headerShadowVisible: false,
        headerShown: true,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="cart.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="clock.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('tabs.catalog'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="tag.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('tabs.reports'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
