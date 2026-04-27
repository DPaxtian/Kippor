import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useOrdersStore } from '@/store/orders-store';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { PaymentMethod } from '@/types';

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  cash: 'banknote.fill', card: 'creditcard.fill', transfer: 'iphone',
};
const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useUIStore();
  const { color, soft } = useAccentColor();
  const { selectedOrder, selectedOrderItems, isLoading, fetchOrderById, updateOrderStatus, deleteOrder, clearSelected } = useOrdersStore();

  useEffect(() => {
    fetchOrderById(Number(id));
    return () => clearSelected();
  }, [id]); // eslint-disable-line

  function handleDelete() {
    Alert.alert(
      'Eliminar pedido',
      `¿Eliminar el pedido de "${selectedOrder?.client_name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteOrder(Number(id)); router.back(); } },
      ]
    );
  }

  if (isLoading || !selectedOrder) {
    return (
      <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  const order = selectedOrder;
  const iconColor = colorScheme === 'dark' ? '#7A6E66' : '#9A8A80';
  const successColor = colorScheme === 'dark' ? '#7BB97A' : '#4F8F5C';

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      <ScrollView contentContainerClassName="p-4 gap-4 pb-8">

        {/* Hero card */}
        <View style={{ backgroundColor: color }} className="rounded-2xl p-5">
          <Text className="text-white/70 text-sm font-medium mb-1">Total</Text>
          <Text className="text-white text-4xl font-bold tracking-tight mb-1">{formatCurrency(order.total)}</Text>
          <Text className="text-white/60 text-sm">{formatDateTime(order.created_at)}</Text>
        </View>

        {/* Status toggles */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => updateOrderStatus(order.id, 'delivery_status', order.delivery_status === 'pending' ? 'delivered' : 'pending')}
            className={`flex-1 rounded-2xl py-4 items-center gap-1.5 border active:opacity-70 ${
              order.delivery_status === 'delivered'
                ? 'bg-success-soft dark:bg-success-soft-dark border-success dark:border-success-dark'
                : 'bg-surface-muted dark:bg-surface-muted-dark border-border dark:border-border-dark'
            }`}
          >
            <IconSymbol name="shippingbox.fill" size={20} color={order.delivery_status === 'delivered' ? successColor : iconColor} />
            <Text className={`text-sm font-semibold ${order.delivery_status === 'delivered' ? 'text-success dark:text-success-dark' : 'text-content-muted dark:text-content-muted-dark'}`}>
              {order.delivery_status === 'pending' ? 'Pendiente' : 'Entregado'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => updateOrderStatus(order.id, 'payment_status', order.payment_status === 'unpaid' ? 'paid' : 'unpaid')}
            className={`flex-1 rounded-2xl py-4 items-center gap-1.5 border active:opacity-70 ${
              order.payment_status === 'paid'
                ? 'bg-success-soft dark:bg-success-soft-dark border-success dark:border-success-dark'
                : 'bg-surface-muted dark:bg-surface-muted-dark border-border dark:border-border-dark'
            }`}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color={order.payment_status === 'paid' ? successColor : iconColor} />
            <Text className={`text-sm font-semibold ${order.payment_status === 'paid' ? 'text-success dark:text-success-dark' : 'text-content-muted dark:text-content-muted-dark'}`}>
              {order.payment_status === 'unpaid' ? 'No pagado' : 'Pagado'}
            </Text>
          </Pressable>
        </View>

        {/* Client */}
        {(order.client_name || (order.has_delivery === 1 && order.client_address)) && (
          <DetailSection title="Cliente">
            <DetailRow icon="person.fill" label={order.client_name} iconColor={iconColor} />
            {order.has_delivery === 1 && order.client_address && (
              <DetailRow icon="location.fill" label={order.client_address} iconColor={iconColor} isLast />
            )}
          </DetailSection>
        )}

        {/* Products */}
        <DetailSection title="Productos">
          {selectedOrderItems.map((item, index) => (
            <View key={item.id} className={`flex-row items-center px-4 py-3 gap-3 ${index < selectedOrderItems.length - 1 ? 'border-b border-border dark:border-border-dark' : ''}`}>
              <View style={{ backgroundColor: soft }} className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0">
                <Text style={{ fontSize: 22 }}>🧁</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-semibold text-content dark:text-content-dark" numberOfLines={1}>{item.product_name}</Text>
                <Text className="text-xs text-content-muted dark:text-content-muted-dark mt-0.5">{item.quantity} × {formatCurrency(item.product_price)}</Text>
              </View>
              <Text className="text-sm font-semibold text-content dark:text-content-dark flex-shrink-0">{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
          <View className="border-t border-border dark:border-border-dark px-4 py-3 gap-1">
            <View className="flex-row justify-between">
              <Text className="text-sm text-content-muted dark:text-content-muted-dark">Subtotal</Text>
              <Text className="text-sm text-content dark:text-content-dark">{formatCurrency(order.subtotal)}</Text>
            </View>
            {order.has_delivery === 1 && order.shipping_cost > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-content-muted dark:text-content-muted-dark">Envío</Text>
                <Text className="text-sm text-content dark:text-content-dark">{formatCurrency(order.shipping_cost)}</Text>
              </View>
            )}
            <View className="flex-row justify-between mt-1">
              <Text className="text-base font-bold text-content dark:text-content-dark">Total</Text>
              <Text style={{ color }} className="text-base font-bold">{formatCurrency(order.total)}</Text>
            </View>
          </View>
        </DetailSection>

        {/* Payment */}
        <DetailSection title="Pago">
          <DetailRow icon={PAYMENT_METHOD_ICONS[order.payment_method] as any} label={PAYMENT_METHOD_LABELS[order.payment_method]} iconColor={iconColor} isLast />
        </DetailSection>

        {/* Notes */}
        {order.notes && (
          <DetailSection title="Notas">
            <View className="px-4 py-3">
              <Text className="text-base text-content dark:text-content-dark leading-6">{order.notes}</Text>
            </View>
          </DetailSection>
        )}

        <Pressable onPress={handleDelete} className="border border-error dark:border-error-dark rounded-xl py-4 items-center mt-2 active:opacity-70">
          <Text className="text-error dark:text-error-dark font-semibold text-base">Eliminar pedido</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider px-1 mb-2">{title}</Text>
      <View className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl overflow-hidden">{children}</View>
    </View>
  );
}

function DetailRow({ icon, label, isLast, iconColor }: { icon: string; label: string; isLast?: boolean; iconColor: string }) {
  return (
    <View className={`flex-row items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-border dark:border-border-dark' : ''}`}>
      <IconSymbol name={icon as any} size={18} color={iconColor} />
      <Text className="flex-1 text-base text-content dark:text-content-dark">{label}</Text>
    </View>
  );
}
