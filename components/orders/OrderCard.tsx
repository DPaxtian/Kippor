import { Pressable, Text, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LabelChip } from '@/components/labels/LabelChip';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useCurrency } from '@/hooks/use-currency';
import { useDateLocale } from '@/hooks/use-locale';
import type { DeliveryStatus, Label, Order, PaymentStatus } from '@/types';
import { formatDateTime } from '@/utils/format';
import { DeliveryStatusBadge, PaymentStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: Order;
  labels?: Label[];
  onPress: () => void;
  onStatusChange: (
    field: 'delivery_status' | 'payment_status',
    value: DeliveryStatus | PaymentStatus
  ) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export function OrderCard({ order, labels = [], onPress, onStatusChange }: OrderCardProps) {
  const { color, soft } = useAccentColor();
  const { fmt } = useCurrency();
  const dateLocale = useDateLocale();

  function toggleDelivery() {
    const next: DeliveryStatus = order.delivery_status === 'pending' ? 'delivered' : 'pending';
    onStatusChange('delivery_status', next);
  }
  function togglePayment() {
    const next: PaymentStatus = order.payment_status === 'unpaid' ? 'paid' : 'unpaid';
    onStatusChange('payment_status', next);
  }

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-2xl p-4 mb-3 border border-border dark:border-border-dark active:opacity-70"
      style={{ shadowColor: '#3C281E', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
    >
      <View className="flex-row items-start mb-3 gap-3">
        <View style={{ backgroundColor: soft }} className="w-11 h-11 rounded-xl items-center justify-center flex-shrink-0">
          <Text style={{ color }} className="font-bold text-sm">{getInitials(order.client_name)}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-base font-semibold text-content dark:text-content-dark" numberOfLines={1}>
            {order.client_name}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <Text className="text-xs text-content-muted dark:text-content-muted-dark">
              {formatDateTime(order.created_at, dateLocale)}
            </Text>
            {order.has_delivery === 1 && (
              <IconSymbol name="shippingbox.fill" size={12} color="#9A8A80" />
            )}
          </View>
        </View>
        <Text style={{ color }} className="text-lg font-bold flex-shrink-0">
          {fmt(order.total)}
        </Text>
      </View>
      <View className="flex-row gap-2 flex-wrap">
        <Pressable onPress={toggleDelivery} className="active:opacity-60">
          <DeliveryStatusBadge status={order.delivery_status} />
        </Pressable>
        <Pressable onPress={togglePayment} className="active:opacity-60">
          <PaymentStatusBadge status={order.payment_status} />
        </Pressable>
        {labels.map((label) => (
          <LabelChip key={label.id} label={label} size="sm" />
        ))}
      </View>
    </Pressable>
  );
}
