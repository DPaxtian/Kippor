import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useCurrency } from '@/hooks/use-currency';

export type SummaryFilter = 'deliver' | 'collect' | 'scheduled' | null;

interface SummaryStripProps {
  todayRevenue: number;
  pendingDeliveries: number;
  unpaidCount: number;
  scheduledCount: number;
  activeFilter: SummaryFilter;
  onFilterChange: (filter: SummaryFilter) => void;
}

export function SummaryStrip({ todayRevenue, pendingDeliveries, unpaidCount, scheduledCount, activeFilter, onFilterChange }: SummaryStripProps) {
  const { t } = useTranslation();
  const { color, soft } = useAccentColor();
  const { fmt } = useCurrency();

  return (
    <View className="gap-2 mb-3">
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onFilterChange(null)}
          style={{ backgroundColor: soft }}
          className="flex-1 rounded-2xl py-2.5 px-3 active:opacity-70"
        >
          <Text style={{ color }} className="text-xs font-semibold uppercase tracking-wider mb-0.5">
            {t('orders.summaryEarn')}
          </Text>
          <Text style={{ color }} className="text-lg font-bold" numberOfLines={1}>
            {fmt(todayRevenue)}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onFilterChange(activeFilter === 'deliver' ? null : 'deliver')}
          style={activeFilter === 'deliver' ? { backgroundColor: soft } : undefined}
          className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl py-2.5 px-3 active:opacity-70"
        >
          <Text
            style={activeFilter === 'deliver' ? { color } : undefined}
            className="text-content-muted dark:text-content-muted-dark text-xs font-semibold uppercase tracking-wider mb-0.5"
          >
            {t('orders.summaryDeliver')}
          </Text>
          <Text
            style={activeFilter === 'deliver' ? { color } : undefined}
            className="text-content dark:text-content-dark text-lg font-bold"
          >
            {pendingDeliveries}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => onFilterChange(activeFilter === 'collect' ? null : 'collect')}
          style={activeFilter === 'collect' ? { backgroundColor: soft } : undefined}
          className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl py-2.5 px-3 active:opacity-70"
        >
          <Text
            style={activeFilter === 'collect' ? { color } : undefined}
            className="text-content-muted dark:text-content-muted-dark text-xs font-semibold uppercase tracking-wider mb-0.5"
          >
            {t('orders.summaryCollect')}
          </Text>
          <Text
            style={activeFilter === 'collect' ? { color } : undefined}
            className="text-content dark:text-content-dark text-lg font-bold"
          >
            {unpaidCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onFilterChange(activeFilter === 'scheduled' ? null : 'scheduled')}
          style={activeFilter === 'scheduled' ? { backgroundColor: soft } : undefined}
          className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl py-2.5 px-3 active:opacity-70"
        >
          <Text
            style={activeFilter === 'scheduled' ? { color } : undefined}
            className="text-content-muted dark:text-content-muted-dark text-xs font-semibold uppercase tracking-wider mb-0.5"
          >
            {t('orders.summaryScheduled')}
          </Text>
          <Text
            style={activeFilter === 'scheduled' ? { color } : undefined}
            className="text-content dark:text-content-dark text-lg font-bold"
          >
            {scheduledCount}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
