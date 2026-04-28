import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useCurrency } from '@/hooks/use-currency';

interface SummaryStripProps {
  todayRevenue: number;
  pendingDeliveries: number;
  unpaidCount: number;
}

export function SummaryStrip({ todayRevenue, pendingDeliveries, unpaidCount }: SummaryStripProps) {
  const { t } = useTranslation();
  const { color, soft } = useAccentColor();
  const { fmt } = useCurrency();

  return (
    <View className="flex-row gap-2 mb-3">
      <View style={{ backgroundColor: soft }} className="flex-1 rounded-2xl py-2.5 px-3">
        <Text style={{ color }} className="text-xs font-semibold uppercase tracking-wider mb-0.5">
          {t('orders.summaryEarn')}
        </Text>
        <Text style={{ color }} className="text-lg font-bold" numberOfLines={1}>
          {fmt(todayRevenue)}
        </Text>
      </View>
      <View className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl py-2.5 px-3">
        <Text className="text-content-muted dark:text-content-muted-dark text-xs font-semibold uppercase tracking-wider mb-0.5">
          {t('orders.summaryDeliver')}
        </Text>
        <Text className="text-content dark:text-content-dark text-lg font-bold">
          {pendingDeliveries}
        </Text>
      </View>
      <View className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl py-2.5 px-3">
        <Text className="text-content-muted dark:text-content-muted-dark text-xs font-semibold uppercase tracking-wider mb-0.5">
          {t('orders.summaryCollect')}
        </Text>
        <Text className="text-content dark:text-content-dark text-lg font-bold">{unpaidCount}</Text>
      </View>
    </View>
  );
}
