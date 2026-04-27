import { Text, View } from 'react-native';
import { useAccentColor } from '@/hooks/use-accent-color';
import { formatCurrency } from '@/utils/format';

interface SummaryStripProps {
  todayRevenue: number;
  pendingDeliveries: number;
  unpaidCount: number;
}

export function SummaryStrip({ todayRevenue, pendingDeliveries, unpaidCount }: SummaryStripProps) {
  const { color, soft } = useAccentColor();

  return (
    <View className="flex-row gap-2 mb-3">
      <View style={{ backgroundColor: soft }} className="flex-1 rounded-2xl py-2.5 px-3">
        <Text style={{ color }} className="text-xs font-semibold uppercase tracking-wider mb-0.5">
          Hoy
        </Text>
        <Text style={{ color }} className="text-lg font-bold" numberOfLines={1}>
          {formatCurrency(todayRevenue)}
        </Text>
      </View>
      <View className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl py-2.5 px-3">
        <Text className="text-content-muted dark:text-content-muted-dark text-xs font-semibold uppercase tracking-wider mb-0.5">
          Entregar
        </Text>
        <Text className="text-content dark:text-content-dark text-lg font-bold">
          {pendingDeliveries}
        </Text>
      </View>
      <View className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl py-2.5 px-3">
        <Text className="text-content-muted dark:text-content-muted-dark text-xs font-semibold uppercase tracking-wider mb-0.5">
          Cobrar
        </Text>
        <Text className="text-content dark:text-content-dark text-lg font-bold">{unpaidCount}</Text>
      </View>
    </View>
  );
}
