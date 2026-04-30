import { format } from 'date-fns';
import { useDateLocale, useDayHeaderFormat } from '@/hooks/use-locale';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderCard } from '@/components/orders/OrderCard';
import { SummaryStrip } from '@/components/orders/SummaryStrip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useLabelsStore } from '@/store/labels-store';
import { useOrdersStore } from '@/store/orders-store';
import type { DeliveryStatus, PaymentStatus } from '@/types';

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { orders, isLoading, fetchTodaysOrders, updateOrderStatus } = useOrdersStore();
  const { orderLabelsMap, fetchLabelsForOrders } = useLabelsStore();
  const { color, soft } = useAccentColor();
  const dateLocale = useDateLocale();
  const dayHeaderFormat = useDayHeaderFormat();

  useFocusEffect(useCallback(() => {
    fetchTodaysOrders().then(() => {
      const ids = useOrdersStore.getState().orders.map((o) => o.id);
      fetchLabelsForOrders(ids);
    });
  }, [fetchTodaysOrders, fetchLabelsForOrders]));

  async function handleStatusChange(id: number, field: 'delivery_status' | 'payment_status', value: DeliveryStatus | PaymentStatus) {
    await updateOrderStatus(id, field, value);
  }

  const todayRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingDeliveries = orders.filter((o) => o.delivery_status === 'pending').length;
  const unpaidCount = orders.filter((o) => o.payment_status === 'unpaid').length;
  const todayLabel = format(new Date(), dayHeaderFormat, { locale: dateLocale });

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={[]}>
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
            {t('orders.empty.title')}
          </Text>
          <Text className="text-base text-content-muted dark:text-content-muted-dark text-center mb-6 leading-6">
            {t('orders.empty.subtitle')}
          </Text>
          <Pressable
            onPress={() => router.push('/orders/new')}
            style={{ backgroundColor: color }}
            className="rounded-xl px-6 py-3.5 active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">{t('orders.empty.cta')}</Text>
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
                labels={orderLabelsMap[item.id] ?? []}
                onPress={() => router.push(`/orders/${item.id}`)}
                onStatusChange={(field, value) => handleStatusChange(item.id, field, value)}
              />
            )}
            contentContainerClassName="px-4 pt-4 pb-24"
            ListHeaderComponent={
              <View>
                <SummaryStrip todayRevenue={todayRevenue} pendingDeliveries={pendingDeliveries} unpaidCount={unpaidCount} />
                <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-3">
                  {t('orders.count', { count: orders.length })} · {todayLabel}
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
