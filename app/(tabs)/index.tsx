import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderCard } from '@/components/orders/OrderCard';
import { SummaryStrip } from '@/components/orders/SummaryStrip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useOrdersStore } from '@/store/orders-store';
import type { DeliveryStatus, PaymentStatus } from '@/types';

export default function OrdersScreen() {
  const { orders, isLoading, fetchTodaysOrders, updateOrderStatus } = useOrdersStore();
  const { color, soft } = useAccentColor();

  useFocusEffect(useCallback(() => { fetchTodaysOrders(); }, [fetchTodaysOrders]));

  async function handleStatusChange(id: number, field: 'delivery_status' | 'payment_status', value: DeliveryStatus | PaymentStatus) {
    await updateOrderStatus(id, field, value);
  }

  const todayRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingDeliveries = orders.filter((o) => o.delivery_status === 'pending').length;
  const unpaidCount = orders.filter((o) => o.payment_status === 'unpaid').length;
  const todayLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      {isLoading && orders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={color} />
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View style={{ backgroundColor: soft }} className="w-20 h-20 rounded-2xl items-center justify-center mb-5">
            <IconSymbol name="cart.fill" size={40} color={color} />
          </View>
          <Text className="text-xl font-bold text-content dark:text-content-dark text-center mb-2">
            Sin pedidos hoy
          </Text>
          <Text className="text-base text-content-muted dark:text-content-muted-dark text-center mb-6 leading-6">
            Cuando agregues un pedido lo verás aquí. Toca el botón para empezar.
          </Text>
          <Pressable
            onPress={() => router.push('/orders/new')}
            style={{ backgroundColor: color }}
            className="rounded-xl px-6 py-3.5 active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">Crear primer pedido</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={orders}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onPress={() => router.push(`/orders/${item.id}`)}
                onStatusChange={(field, value) => handleStatusChange(item.id, field, value)}
              />
            )}
            contentContainerClassName="px-4 pt-4 pb-24"
            ListHeaderComponent={
              <View>
                <SummaryStrip todayRevenue={todayRevenue} pendingDeliveries={pendingDeliveries} unpaidCount={unpaidCount} />
                <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-3">
                  {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} · {todayLabel}
                </Text>
              </View>
            }
          />
          <Pressable
            onPress={() => router.push('/orders/new')}
            className="absolute bottom-8 right-6 w-14 h-14 rounded-full items-center justify-center active:opacity-80"
            style={{ backgroundColor: color, shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
          >
            <IconSymbol name="plus" size={28} color="white" />
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}
