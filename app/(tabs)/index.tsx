import { format, isToday, isTomorrow } from 'date-fns';
import { useDateLocale, useDayHeaderFormat } from '@/hooks/use-locale';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderCard } from '@/components/orders/OrderCard';
import { SummaryStrip, type SummaryFilter } from '@/components/orders/SummaryStrip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useLabelsStore } from '@/store/labels-store';
import { useOrdersStore } from '@/store/orders-store';
import type { DeliveryStatus, Order, PaymentStatus } from '@/types';

type ScheduledItem = { type: 'header'; label: string; dateKey: string } | { type: 'order'; order: Order };

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { orders, scheduledOrders, isLoading, fetchTodaysOrders, fetchScheduledOrders, updateOrderStatus } = useOrdersStore();
  const { orderLabelsMap, fetchLabelsForOrders } = useLabelsStore();
  const { color, soft } = useAccentColor();
  const dateLocale = useDateLocale();
  const dayHeaderFormat = useDayHeaderFormat();
  const [activeFilter, setActiveFilter] = useState<SummaryFilter>(null);

  useFocusEffect(useCallback(() => {
    fetchTodaysOrders().then(() => {
      const ids = useOrdersStore.getState().orders.map((o) => o.id);
      fetchLabelsForOrders(ids);
    });
    fetchScheduledOrders();
  }, [fetchTodaysOrders, fetchScheduledOrders, fetchLabelsForOrders]));

  async function handleStatusChange(id: number, field: 'delivery_status' | 'payment_status', value: DeliveryStatus | PaymentStatus) {
    await updateOrderStatus(id, field, value);
  }

  const todayRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingDeliveries = orders.filter((o) => o.delivery_status === 'pending').length;
  const unpaidCount = orders.filter((o) => o.payment_status === 'unpaid').length;
  const todayLabel = format(new Date(), dayHeaderFormat, { locale: dateLocale });

  const filteredOrders = activeFilter === 'deliver'
    ? orders.filter((o) => o.delivery_status === 'pending')
    : activeFilter === 'collect'
      ? orders.filter((o) => o.payment_status === 'unpaid')
      : orders;

  const scheduledItems = useMemo<ScheduledItem[]>(() => {
    const map = new Map<string, Order[]>();
    scheduledOrders.forEach((o) => {
      const key = o.delivery_date!.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    });
    const items: ScheduledItem[] = [];
    map.forEach((dayOrders, dateKey) => {
      const d = new Date(`${dateKey}T12:00:00`);
      let label = '';
      if (isToday(d)) label = t('common.today');
      else if (isTomorrow(d)) label = t('common.tomorrow');
      else label = format(d, dayHeaderFormat, { locale: dateLocale });
      items.push({ type: 'header', label, dateKey });
      dayOrders.forEach((o) => items.push({ type: 'order', order: o }));
    });
    return items;
  }, [scheduledOrders, dateLocale, dayHeaderFormat, t]);

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
          {activeFilter === 'scheduled' ? (
            <FlatList
              data={scheduledItems}
              keyExtractor={(item) => item.type === 'header' ? `h-${item.dateKey}` : `o-${item.order.id}`}
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <Text className="text-xs font-bold text-content dark:text-content-dark capitalize tracking-wider px-1 mb-2 mt-1">
                      {item.label}
                    </Text>
                  );
                }
                return (
                  <OrderCard
                    order={item.order}
                    labels={orderLabelsMap[item.order.id] ?? []}
                    onPress={() => router.push(`/orders/${item.order.id}`)}
                    onStatusChange={(field, value) => handleStatusChange(item.order.id, field, value)}
                  />
                );
              }}
              contentContainerClassName="px-4 pt-4 pb-24"
              ListHeaderComponent={
                <View>
                  <SummaryStrip
                    todayRevenue={todayRevenue}
                    pendingDeliveries={pendingDeliveries}
                    unpaidCount={unpaidCount}
                    scheduledCount={scheduledOrders.length}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                  />
                </View>
              }
              ListEmptyComponent={
                <View className="items-center py-12">
                  <Text className="text-sm text-content-muted dark:text-content-muted-dark">{t('orders.noScheduled')}</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={filteredOrders}
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
                  <SummaryStrip
                    todayRevenue={todayRevenue}
                    pendingDeliveries={pendingDeliveries}
                    unpaidCount={unpaidCount}
                    scheduledCount={scheduledOrders.length}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                  />
                  <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-3">
                    {t('orders.count', { count: filteredOrders.length })} · {todayLabel}
                  </Text>
                </View>
              }
            />
          )}
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
