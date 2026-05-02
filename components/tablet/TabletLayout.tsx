import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

import { LabelChip } from '@/components/labels/LabelChip';
import { LabelFilterBar } from '@/components/labels/LabelFilterBar';
import { HistoryFilterModal, type HistoryFilters } from '@/components/history/HistoryFilterModal';
import { DeliveryStatusBadge, PaymentStatusBadge } from '@/components/orders/OrderStatusBadge';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import { SparklineChart } from '@/components/reports/SparklineChart';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getPaletteTokens } from '@/constants/palette';
import { getDatabase } from '@/db/database';
import { getSalesSummary, getTopProducts, getWeeklyRevenue, getPreviousPeriodRevenue, getExpenseSummaryForPeriod } from '@/db/reports';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_COLORS } from '@/constants/expense-categories';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useCurrency } from '@/hooks/use-currency';
import { useDateLocale, useDayHeaderFormat, useDateFormat } from '@/hooks/use-locale';
import { useLabelsStore } from '@/store/labels-store';
import { useOrdersStore } from '@/store/orders-store';
import { useProductsStore } from '@/store/products-store';
import { useUIStore } from '@/store/ui-store';
import type { Expense, ExpenseCategory, ExpenseSummary, Order, PaymentMethod, Product, ProductStat, ReportPeriod, SalesSummary } from '@/types';
import { formatDate, formatDateTime, formatShortDate } from '@/utils/format';
import { getDateRange } from '@/utils/dates';
import { CustomToggle } from '@/components/ui/CustomToggle';
import { PALETTES } from '@/constants/palette';
import { ExportModal } from '@/components/ui/ExportModal';
import { AppTextInput } from '@/components/ui/AppTextInput';
import type { AccentPalette } from '@/store/ui-store';

type TabId = 'orders' | 'history' | 'catalog' | 'reports' | 'expenses' | 'settings';

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function TabletSidebar({ activeTab, onTab }: { activeTab: TabId; onTab: (t: TabId) => void }) {
  const { t } = useTranslation();
  const { colorScheme, toggleColorScheme, businessName } = useUIStore();
  const { color, soft } = useAccentColor();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? '#211C19' : '#FFFFFF';
  const border = isDark ? '#332A26' : '#E8E0D8';
  const textColor = isDark ? '#F4EDE7' : '#1F1815';
  const mutedColor = isDark ? '#B8ADA5' : '#6B5D54';
  const surfaceMuted = isDark ? '#2A231F' : '#F2EDE8';

  const items: { id: TabId; icon: string; label: string }[] = [
    { id: 'orders', icon: 'cart.fill', label: t('tabs.orders') },
    { id: 'history', icon: 'clock.fill', label: t('tabs.history') },
    { id: 'catalog', icon: 'tag.fill', label: t('tabs.catalog') },
    { id: 'reports', icon: 'chart.bar.fill', label: t('tabs.reports') },
    { id: 'expenses', icon: 'minus.circle.fill', label: t('tabs.expenses') },
    { id: 'settings', icon: 'gearshape.fill', label: t('tabs.settings') },
  ];

  const initial = businessName.charAt(0).toUpperCase();

  return (
    <View style={{ width: 240, backgroundColor: bg, borderRightWidth: 0.5, borderRightColor: border, flexShrink: 0 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 18 }}>
          {/* Brand */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingBottom: 22, paddingTop: 4 }}>
            <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.5 }}>{initial}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor, letterSpacing: -0.4, lineHeight: 20 }}>Kippor</Text>
              <Text style={{ fontSize: 11, color: mutedColor, marginTop: 1 }}>{businessName}</Text>
            </View>
          </View>

          {/* Nav items */}
          <View style={{ gap: 2 }}>
            {items.map((item) => {
              const active = activeTab === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onTab(item.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
                    backgroundColor: active ? soft : 'transparent',
                  }}
                  className="active:opacity-70"
                >
                  <IconSymbol name={item.icon as any} size={19} color={active ? color : mutedColor} />
                  <Text style={{ fontSize: 14.5, fontWeight: active ? '600' : '500', color: active ? color : textColor }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flex: 1 }} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Orders master/detail ─────────────────────────────────────────────────────

function TabletOrders() {
  const { t } = useTranslation();
  const { orders, scheduledOrders, isLoading, fetchTodaysOrders, fetchScheduledOrders, updateOrderStatus, fetchOrderById,
    selectedOrder, selectedOrderItems, selectedOrderLabels, deleteOrder, clearSelected,
    lastCreatedId, clearLastCreatedId } = useOrdersStore();
  const { orderLabelsMap, fetchLabelsForOrders } = useLabelsStore();
  const { color, soft } = useAccentColor();
  const { fmt } = useCurrency();
  const dateLocale = useDateLocale();
  const dayHeaderFormat = useDayHeaderFormat();
  const { colorScheme } = useUIStore();

  const isDark = colorScheme === 'dark';
  const border = isDark ? '#332A26' : '#E8E0D8';
  const bg = isDark ? '#171311' : '#FAF7F4';
  const bgElev = isDark ? '#211C19' : '#FFFFFF';
  const textColor = isDark ? '#F4EDE7' : '#1F1815';
  const mutedColor = isDark ? '#B8ADA5' : '#6B5D54';
  const subtleColor = isDark ? '#7A6E66' : '#9A8A80';
  const successColor = isDark ? '#7BB97A' : '#4F8F5C';
  const warnColor = isDark ? '#E5B257' : '#B47A1C';

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<'deliver' | 'collect' | 'scheduled' | null>(null);

  useFocusEffect(useCallback(() => {
    fetchTodaysOrders().then(() => {
      const state = useOrdersStore.getState();
      const ids = state.orders.map((o) => o.id);
      fetchLabelsForOrders(ids);
      if (state.lastCreatedId !== null) {
        setSelectedId(state.lastCreatedId);
        clearLastCreatedId();
      }
    });
    fetchScheduledOrders();
    return () => clearSelected();
  }, [fetchTodaysOrders, fetchScheduledOrders, fetchLabelsForOrders, clearSelected, clearLastCreatedId]));

  useEffect(() => {
    if (selectedId !== null) fetchOrderById(selectedId);
  }, [selectedId, fetchOrderById]);

  function selectOrder(id: number) {
    setSelectedId(id);
    fetchOrderById(id);
  }

  // Auto-select first order if nothing selected
  useEffect(() => {
    if (orders.length > 0 && selectedId === null) setSelectedId(orders[0].id);
  }, [orders]); // eslint-disable-line

  const todayRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter((o) => o.delivery_status === 'pending').length;
  const unpaidCount = orders.filter((o) => o.payment_status === 'unpaid').length;

  const filteredOrders = activeFilter === 'deliver'
    ? orders.filter((o) => o.delivery_status === 'pending')
    : activeFilter === 'collect'
      ? orders.filter((o) => o.payment_status === 'unpaid')
      : orders;

  const scheduledGroups = useMemo(() => {
    const map = new Map<string, Order[]>();
    scheduledOrders.forEach((o) => {
      const key = o.delivery_date!.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    });
    return [...map.entries()].map(([dateKey, dayOrders]) => {
      const d = new Date(`${dateKey}T12:00:00`);
      let label = '';
      if (isToday(d)) label = t('common.today');
      else if (isTomorrow(d)) label = t('common.tomorrow');
      else label = format(d, dayHeaderFormat, { locale: dateLocale });
      return { dateKey, label, orders: dayOrders };
    });
  }, [scheduledOrders, dateLocale, dayHeaderFormat, t]);

  function handleDelete() {
    if (!selectedOrder) return;
    Alert.alert(
      t('orderDetail.deleteTitle'),
      t('orderDetail.deleteMessage', { name: selectedOrder.client_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            await deleteOrder(selectedOrder.id);
            setSelectedId(null);
            clearSelected();
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Master list */}
      <View style={{ width: 380, flexShrink: 0, borderRightWidth: 0.5, borderRightColor: border, backgroundColor: bgElev }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={{ padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: textColor, letterSpacing: -0.5 }}>
                {t('tabs.orders')}
              </Text>
              <Pressable
                onPress={() => router.push('/orders/new')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: color }}
                className="active:opacity-80"
              >
                <IconSymbol name="plus" size={15} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{t('orders.new')}</Text>
              </Pressable>
            </View>
            {/* Summary strip — 2x2 grid */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <SummaryCell label={t('orders.summaryEarn')} value={fmt(todayRevenue)} accent onPress={() => setActiveFilter(null)} color={color} soft={soft} isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor} bgElev={bgElev} />
                <SummaryCell label={t('orders.summaryDeliver')} value={String(pendingCount)} active={activeFilter === 'deliver'} onPress={() => setActiveFilter(activeFilter === 'deliver' ? null : 'deliver')} color={color} soft={soft} isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor} bgElev={bgElev} />
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <SummaryCell label={t('orders.summaryCollect')} value={String(unpaidCount)} active={activeFilter === 'collect'} onPress={() => setActiveFilter(activeFilter === 'collect' ? null : 'collect')} color={color} soft={soft} isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor} bgElev={bgElev} />
                <SummaryCell label={t('orders.summaryScheduled')} value={String(scheduledOrders.length)} active={activeFilter === 'scheduled'} onPress={() => setActiveFilter(activeFilter === 'scheduled' ? null : 'scheduled')} color={color} soft={soft} isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor} bgElev={bgElev} />
              </View>
            </View>
          </View>

          {isLoading && orders.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={color} />
            </View>
          ) : orders.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <Text style={{ color: mutedColor, fontSize: 14, textAlign: 'center' }}>{t('orders.empty.title')}</Text>
            </View>
          ) : activeFilter === 'scheduled' ? (
            <FlatList
              data={scheduledGroups}
              keyExtractor={(g) => g.dateKey}
              contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
              ListEmptyComponent={
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: mutedColor, fontSize: 14, textAlign: 'center' }}>{t('orders.noScheduled')}</Text>
                </View>
              }
              renderItem={({ item: group }) => (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 4, paddingBottom: 6 }}>
                    {group.label}
                  </Text>
                  {group.orders.map((order) => (
                    <OrderListRow
                      key={order.id}
                      order={order}
                      labels={orderLabelsMap[order.id] ?? []}
                      active={order.id === selectedId}
                      onPress={() => selectOrder(order.id)}
                      color={color} soft={soft} isDark={isDark}
                      border={border} textColor={textColor} mutedColor={mutedColor}
                    />
                  ))}
                </View>
              )}
            />
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(o) => String(o.id)}
              contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <OrderListRow
                  order={item}
                  labels={orderLabelsMap[item.id] ?? []}
                  active={item.id === selectedId}
                  onPress={() => selectOrder(item.id)}
                  color={color} soft={soft} isDark={isDark}
                  border={border} textColor={textColor} mutedColor={mutedColor}
                />
              )}
            />
          )}
        </SafeAreaView>
      </View>

      {/* Detail pane */}
      <View style={{ flex: 1, backgroundColor: bg }}>
        {selectedOrder ? (
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={{ padding: 32, paddingBottom: 60, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
              <OrderDetailContent
                order={selectedOrder}
                items={selectedOrderItems}
                labels={selectedOrderLabels}
                onEdit={() => router.push({ pathname: '/orders/edit', params: { id: selectedOrder.id } })}
                onDelete={handleDelete}
                onToggleDelivery={() => updateOrderStatus(selectedOrder.id, 'delivery_status', selectedOrder.delivery_status === 'pending' ? 'delivered' : 'pending')}
                onTogglePayment={() => updateOrderStatus(selectedOrder.id, 'payment_status', selectedOrder.payment_status === 'unpaid' ? 'paid' : 'unpaid')}
                color={color} soft={soft} isDark={isDark} fmt={fmt}
                border={border} textColor={textColor} mutedColor={mutedColor} subtleColor={subtleColor}
                successColor={successColor} warnColor={warnColor}
                dateLocale={dateLocale}
              />
            </ScrollView>
          </SafeAreaView>
        ) : (
          <EmptyDetailHint icon="cart.fill" label={t('orderDetail.selectHint')} color={mutedColor} subtleColor={subtleColor} />
        )}
      </View>
    </View>
  );
}

// ─── History master/detail ────────────────────────────────────────────────────

const DEFAULT_HISTORY_FILTERS: HistoryFilters = {
  period: 'month',
  customFrom: '',
  customTo: '',
  paymentStatus: 'all',
  paymentMethods: [],
  labelIds: [],
};

function TabletHistory() {
  const { t } = useTranslation();
  const { orders, isLoading, fetchOrdersByRange, fetchOrderById,
    selectedOrder, selectedOrderItems, selectedOrderLabels, clearSelected } = useOrdersStore();
  const { orderLabelsMap, fetchLabels, fetchLabelsForOrders } = useLabelsStore();
  const { color, soft } = useAccentColor();
  const { fmt } = useCurrency();
  const dateLocale = useDateLocale();
  const dayHeaderFormat = useDayHeaderFormat();
  const { colorScheme } = useUIStore();

  const isDark = colorScheme === 'dark';
  const border = isDark ? '#332A26' : '#E8E0D8';
  const bg = isDark ? '#171311' : '#FAF7F4';
  const bgElev = isDark ? '#211C19' : '#FFFFFF';
  const textColor = isDark ? '#F4EDE7' : '#1F1815';
  const mutedColor = isDark ? '#B8ADA5' : '#6B5D54';
  const subtleColor = isDark ? '#7A6E66' : '#9A8A80';
  const successColor = isDark ? '#7BB97A' : '#4F8F5C';
  const warnColor = isDark ? '#E5B257' : '#B47A1C';

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const dateRange = useMemo(() => {
    if (filters.period === 'custom' && filters.customFrom && filters.customTo) {
      return {
        from: new Date(`${filters.customFrom}T00:00:00`).toISOString(),
        to: new Date(`${filters.customTo}T23:59:59`).toISOString(),
      };
    }
    if (filters.period !== 'custom') return getDateRange(filters.period);
    return getDateRange('month');
  }, [filters.period, filters.customFrom, filters.customTo]);

  useFocusEffect(useCallback(() => {
    fetchLabels();
    fetchOrdersByRange(dateRange.from, dateRange.to).then(() => {
      const ids = useOrdersStore.getState().orders.map((o) => o.id);
      fetchLabelsForOrders(ids);
    });
    return () => clearSelected();
  }, [fetchOrdersByRange, fetchLabels, fetchLabelsForOrders, clearSelected]));

  useEffect(() => {
    fetchOrdersByRange(dateRange.from, dateRange.to).then(() => {
      const ids = useOrdersStore.getState().orders.map((o) => o.id);
      fetchLabelsForOrders(ids);
    });
  }, [dateRange]); // eslint-disable-line

  useEffect(() => {
    if (selectedId !== null) fetchOrderById(selectedId);
  }, [selectedId, fetchOrderById]);

  function selectOrder(id: number) {
    setSelectedId(id);
    fetchOrderById(id);
  }

  const todayStr = t('common.today');
  const yesterdayStr = t('common.yesterday');

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = orders.filter((o) => {
      if (filters.paymentStatus === 'paid' && o.payment_status !== 'paid') return false;
      if (filters.paymentStatus === 'unpaid' && o.payment_status !== 'unpaid') return false;
      if (filters.paymentMethods.length > 0 && !filters.paymentMethods.includes(o.payment_method as PaymentMethod)) return false;
      if (filters.labelIds.length > 0) {
        const orderLabelIds = (orderLabelsMap[o.id] ?? []).map((l) => l.id);
        if (!filters.labelIds.some((id) => orderLabelIds.includes(id))) return false;
      }
      if (q && !o.client_name.toLowerCase().includes(q)) return false;
      return true;
    });
    const map = new Map<string, Order[]>();
    filtered.forEach((o) => {
      const key = o.created_at.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    });
    return [...map.entries()].map(([key, dayOrders]) => {
      const d = new Date(dayOrders[0].created_at);
      let label = '';
      if (isToday(d)) label = todayStr;
      else if (isYesterday(d)) label = `${yesterdayStr} · ${format(d, 'EEE d MMM', { locale: dateLocale })}`;
      else label = format(d, dayHeaderFormat, { locale: dateLocale });
      return { key, label, orders: dayOrders, total: dayOrders.reduce((s, o) => s + o.total, 0) };
    });
  }, [orders, search, filters, orderLabelsMap, todayStr, yesterdayStr, dateLocale, dayHeaderFormat]);

  const totalRevenue = groups.reduce((s, g) => s + g.total, 0);
  const totalCount = groups.reduce((s, g) => s + g.orders.length, 0);

  const activeFilterCount =
    (filters.period !== 'month' ? 1 : 0) +
    (filters.paymentStatus !== 'all' ? 1 : 0) +
    (filters.paymentMethods.length > 0 ? 1 : 0) +
    (filters.labelIds.length > 0 ? 1 : 0);

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Master list */}
      <View style={{ width: 380, flexShrink: 0, borderRightWidth: 0.5, borderRightColor: border, backgroundColor: bgElev }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={{ padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: border }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: textColor, letterSpacing: -0.5, marginBottom: 12 }}>
              {t('tabs.history')}
            </Text>
            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
              <SummaryCell label={t('history.totalRevenue')} value={fmt(totalRevenue)} accent color={color} soft={soft} isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor} bgElev={bgElev} />
              <SummaryCell label={t('history.totalOrders')} value={String(totalCount)} color={color} soft={soft} isDark={isDark} border={border} textColor={textColor} mutedColor={mutedColor} bgElev={bgElev} />
            </View>
            {/* Search + filter button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                <IconSymbol name="magnifyingglass" size={15} color={subtleColor} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('history.searchPlaceholder')}
                  placeholderTextColor={subtleColor}
                  style={{ flex: 1, fontSize: 13.5, color: textColor, padding: 0 }}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} className="active:opacity-60">
                    <IconSymbol name="xmark.circle.fill" size={15} color={subtleColor} />
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={() => setShowFilters(true)}
                style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: activeFilterCount > 0 ? color : bgElev, borderWidth: 1, borderColor: activeFilterCount > 0 ? color : border }}
                className="active:opacity-70"
              >
                <IconSymbol name="line.3.horizontal.decrease" size={16} color={activeFilterCount > 0 ? '#fff' : subtleColor} />
              </Pressable>
              {activeFilterCount > 0 && (
                <Pressable
                  onPress={() => setFilters(DEFAULT_HISTORY_FILTERS)}
                  style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: bgElev, borderWidth: 1, borderColor: border }}
                  className="active:opacity-70"
                >
                  <IconSymbol name="xmark" size={14} color={subtleColor} />
                </Pressable>
              )}
            </View>
          </View>

          {isLoading && orders.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={color} />
            </View>
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(g) => g.key}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
              ListEmptyComponent={
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: mutedColor, fontSize: 14, textAlign: 'center' }}>{t('history.noResults')}</Text>
                </View>
              }
              renderItem={({ item: group }) => (
                <View style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4, paddingBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.4 }}>{group.label}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: mutedColor }}>{group.orders.length} · {fmt(group.total)}</Text>
                  </View>
                  {group.orders.map((order) => (
                    <OrderListRow
                      key={order.id}
                      order={order}
                      labels={orderLabelsMap[order.id] ?? []}
                      active={order.id === selectedId}
                      onPress={() => selectOrder(order.id)}
                      color={color} soft={soft} isDark={isDark}
                      border={border} textColor={textColor} mutedColor={mutedColor}
                    />
                  ))}
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </View>

      {/* Detail pane */}
      <View style={{ flex: 1, backgroundColor: bg }}>
        {selectedOrder ? (
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={{ padding: 32, paddingBottom: 60, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
              <OrderDetailContent
                order={selectedOrder}
                items={selectedOrderItems}
                labels={selectedOrderLabels}
                readOnly
                color={color} soft={soft} isDark={isDark} fmt={fmt}
                border={border} textColor={textColor} mutedColor={mutedColor} subtleColor={subtleColor}
                successColor={successColor} warnColor={warnColor}
                dateLocale={dateLocale}
              />
            </ScrollView>
          </SafeAreaView>
        ) : (
          <EmptyDetailHint icon="clock.fill" label={t('history.selectHint')} color={mutedColor} subtleColor={subtleColor} />
        )}
      </View>

      <HistoryFilterModal
        visible={showFilters}
        filters={filters}
        onChange={setFilters}
        onClose={() => setShowFilters(false)}
      />
    </View>
  );
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

function TabletCatalog() {
  const { t } = useTranslation();
  const { products, isLoading, fetchProducts, lastCreatedId: lastCreatedProductId, clearLastCreatedId: clearLastCreatedProductId } = useProductsStore();
  const { color, soft } = useAccentColor();
  const { fmt } = useCurrency();
  const { colorScheme } = useUIStore();

  const isDark = colorScheme === 'dark';
  const border = isDark ? '#332A26' : '#E8E0D8';
  const bg = isDark ? '#171311' : '#FAF7F4';
  const bgElev = isDark ? '#211C19' : '#FFFFFF';
  const textColor = isDark ? '#F4EDE7' : '#1F1815';
  const mutedColor = isDark ? '#B8ADA5' : '#6B5D54';
  const subtleColor = isDark ? '#7A6E66' : '#9A8A80';
  const surfaceMuted = isDark ? '#2A231F' : '#F2EDE8';

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = products.find((p) => p.id === selectedId) ?? null;

  useFocusEffect(useCallback(() => {
    fetchProducts().then(() => {
      const state = useProductsStore.getState();
      if (state.lastCreatedId !== null) {
        setSelectedId(state.lastCreatedId);
        clearLastCreatedProductId();
      }
    });
  }, [fetchProducts, clearLastCreatedProductId]));

  const prices = products.map((p) => p.price);
  const priceMin = prices.length ? Math.min(...prices) : 0;
  const priceMax = prices.length ? Math.max(...prices) : 0;
  const priceAvg = prices.length ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : 0;
  const priciest = products.find((p) => p.price === priceMax) ?? null;
  const cheapest = products.find((p) => p.price === priceMin) ?? null;

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Grid */}
      <View style={{ flex: 1, backgroundColor: bg }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          {isLoading && products.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={color} />
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(p) => String(p.id)}
              numColumns={3}
              columnWrapperStyle={{ gap: 14, paddingHorizontal: 28 }}
              ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
              contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
              ListHeaderComponent={
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, marginBottom: 18 }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: textColor, letterSpacing: -0.5 }}>{t('tabs.catalog')}</Text>
                  <Pressable
                    onPress={() => router.push('/catalog/new')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: color }}
                    className="active:opacity-80"
                  >
                    <IconSymbol name="plus" size={15} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '600' }}>{t('catalog.newProduct')}</Text>
                  </Pressable>
                </View>
              }
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
                  <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: soft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <IconSymbol name="tag.fill" size={38} color={color} />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 6 }}>{t('catalog.empty')}</Text>
                  <Text style={{ fontSize: 14, color: mutedColor, textAlign: 'center' }}>{t('catalog.emptySubtitle')}</Text>
                </View>
              }
              renderItem={({ item }) => {
                const active = item.id === selectedId;
                return (
                  <Pressable
                    onPress={() => setSelectedId(active ? null : item.id)}
                    style={{
                      flex: 1, backgroundColor: bgElev,
                      borderWidth: 1.5, borderColor: active ? color : border,
                      borderRadius: 16, overflow: 'hidden',
                    }}
                    className="active:opacity-70"
                  >
                    <View style={{ aspectRatio: 1.2, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
                      {item.image_uri ? (
                        <Image source={{ uri: item.image_uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      ) : (
                        <Text style={{ fontSize: 48 }}>{item.emoji ?? '🧁'}</Text>
                      )}
                    </View>
                    <View style={{ padding: 14 }}>
                      <Text style={{ fontSize: 14.5, fontWeight: '600', color: textColor, letterSpacing: -0.2, marginBottom: 3 }} numberOfLines={2}>{item.name}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color }}>{fmt(item.price)}</Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </SafeAreaView>
      </View>

      {/* Detail / empty pane */}
      <View style={{ width: 340, flexShrink: 0, borderLeftWidth: 0.5, borderLeftColor: border, backgroundColor: bgElev }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            {selected ? (
              <View>
                <View style={{ aspectRatio: 1.2, backgroundColor: soft, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {selected.image_uri ? (
                    <Image source={{ uri: selected.image_uri }} style={{ width: '100%', height: '100%', borderRadius: 18 }} contentFit="cover" />
                  ) : (
                    <Text style={{ fontSize: 72 }}>{selected.emoji ?? '🧁'}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: textColor, letterSpacing: -0.4, marginBottom: 4 }}>{selected.name}</Text>
                <Text style={{ fontSize: 22, fontWeight: '700', color, marginBottom: selected.description ? 10 : 22 }}>{fmt(selected.price)}</Text>
                {selected.description ? (
                  <Text style={{ fontSize: 14, color: mutedColor, lineHeight: 20, marginBottom: 22 }}>{selected.description}</Text>
                ) : null}
                <Pressable
                  onPress={() => router.push(`/catalog/${selected.id}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: surfaceMuted, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: border }}
                  className="active:opacity-70"
                >
                  <IconSymbol name="pencil" size={15} color={textColor} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{t('catalog.editProduct')}</Text>
                </Pressable>
              </View>
            ) : (
              <CatalogEmptyPane
                products={products} fmt={fmt} color={color} soft={soft}
                border={border} textColor={textColor} mutedColor={mutedColor} subtleColor={subtleColor}
                surfaceMuted={surfaceMuted} bgElev={bgElev} bg={bg}
                priceMin={priceMin} priceAvg={priceAvg} priceMax={priceMax}
                priciest={priciest} cheapest={cheapest}
                onNew={() => router.push('/catalog/new')}
                onSelect={setSelectedId}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────

function TabletReports() {
  const { t } = useTranslation();
  const { reportPeriod, reportDateRange, setReportPeriod, setReportDateRange } = useUIStore();
  const { color, soft } = useAccentColor();
  const { fmt } = useCurrency();
  const { labels, fetchLabels } = useLabelsStore();

  const PERIOD_LABELS: Record<ReportPeriod, string> = {
    today: t('reports.periodToday'), week: t('reports.periodWeek'),
    month: t('reports.periodMonth'), year: t('reports.periodYear'), custom: t('reports.periodCustom'),
  };
  const WEEK_LABELS = t('reports.weekDays', { returnObjects: true }) as string[];

  const [labelFilter, setLabelFilter] = useState<number[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<number[]>(Array(7).fill(0));
  const [previousRevenue, setPreviousRevenue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => { fetchLabels(); }, []); // eslint-disable-line
  useFocusEffect(useCallback(() => { loadData(); }, [reportDateRange, labelFilter])); // eslint-disable-line

  async function loadData() {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const labelIds = labelFilter.length > 0 ? labelFilter : undefined;
      const [s, products, weekly, prevRev, expSummary] = await Promise.all([
        getSalesSummary(db, reportDateRange.from, reportDateRange.to, labelIds),
        getTopProducts(db, reportDateRange.from, reportDateRange.to, labelIds),
        getWeeklyRevenue(db, new Date(reportDateRange.to), labelIds),
        getPreviousPeriodRevenue(db, reportDateRange.from, reportDateRange.to, labelIds),
        getExpenseSummaryForPeriod(db, reportDateRange.from, reportDateRange.to),
      ]);
      setSummary(s); setTopProducts(products); setWeeklyRevenue(weekly); setPreviousRevenue(prevRev);
      setExpenseSummary(expSummary);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }

  const { colorScheme } = useUIStore();
  const isDark = colorScheme === 'dark';
  const border = isDark ? '#332A26' : '#E8E0D8';
  const bg = isDark ? '#171311' : '#FAF7F4';
  const bgElev = isDark ? '#211C19' : '#FFFFFF';
  const textColor = isDark ? '#F4EDE7' : '#1F1815';
  const mutedColor = isDark ? '#B8ADA5' : '#6B5D54';
  const warnColor = isDark ? '#E5B257' : '#B47A1C';
  const warnBg = isDark ? '#2B2010' : '#FBF1D9';

  const maxQty = topProducts.length > 0 ? topProducts[0].totalQuantity : 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 32, paddingBottom: 60, maxWidth: 900, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: textColor, letterSpacing: -0.6 }}>{t('tabs.reports')}</Text>
          <Pressable
            onPress={() => setShowExportModal(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: color }}
            className="active:opacity-80"
          >
            <IconSymbol name="square.and.arrow.up" size={15} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '600' }}>{t('reports.export')}</Text>
          </Pressable>
        </View>
        <DateRangePicker
          selected={reportPeriod} customFrom={customFrom} customTo={customTo}
          onSelectPeriod={(p) => { setReportPeriod(p); if (p !== 'custom') setReportDateRange(getDateRange(p)); }}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={(v) => { setCustomTo(v); if (customFrom) setReportDateRange({ from: new Date(`${customFrom}T00:00:00`).toISOString(), to: new Date(`${v}T23:59:59`).toISOString() }); }}
        />
        <LabelFilterBar labels={labels} selectedIds={labelFilter} onChange={setLabelFilter} label={t('reports.filterLabel')} />

        {isLoading ? (
          <View style={{ paddingVertical: 64, alignItems: 'center' }}><ActivityIndicator size="large" color={color} /></View>
        ) : summary ? (
          <>
            <View style={{ backgroundColor: color, borderRadius: 20, padding: 20, marginBottom: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                {t('reports.revenue', { period: PERIOD_LABELS[reportPeriod] })}
              </Text>
              <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700', letterSpacing: -1, marginBottom: 4 }}>{fmt(summary.totalRevenue)}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 14 }}>
                {previousRevenue === 0 ? t('reports.noPreviousData') : (() => { const pct = ((summary.totalRevenue - previousRevenue) / previousRevenue) * 100; const sign = pct >= 0 ? '+' : ''; return t('reports.vsLastPeriod', { sign, pct: pct.toFixed(0) }); })()}
              </Text>
              <SparklineChart data={weeklyRevenue} labels={WEEK_LABELS} />
            </View>

            {/* Gastos + Ganancia neta */}
            {expenseSummary && (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1, backgroundColor: bgElev, borderRadius: 16, borderWidth: 1, borderColor: border, padding: 16 }}>
                  <Text style={{ color: mutedColor, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>{t('reports.totalExpenses')}</Text>
                  <Text style={{ color: '#EF4444', fontSize: 24, fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>{fmt(expenseSummary.totalExpenses)}</Text>
                </View>
                <View style={{ flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, backgroundColor: summary.totalRevenue - expenseSummary.totalExpenses >= 0 ? '#22C55E22' : '#EF444422', borderColor: summary.totalRevenue - expenseSummary.totalExpenses >= 0 ? '#22C55E44' : '#EF444444' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6, color: summary.totalRevenue - expenseSummary.totalExpenses >= 0 ? '#22C55E' : '#EF4444' }}>{t('reports.netProfit')}</Text>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: summary.totalRevenue - expenseSummary.totalExpenses >= 0 ? '#22C55E' : '#EF4444' }} numberOfLines={1} adjustsFontSizeToFit>{fmt(summary.totalRevenue - expenseSummary.totalExpenses)}</Text>
                </View>
              </View>
            )}

            {/* Pedidos + desglose por método */}
            <View style={{ backgroundColor: bgElev, borderRadius: 16, borderWidth: 1, borderColor: border, padding: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: mutedColor, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 }}>{t('reports.orders')}</Text>
                <Text style={{ color: textColor, fontSize: 24, fontWeight: '700' }}>{summary.totalOrders}</Text>
              </View>
              <View style={{ flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: border, paddingTop: 12, gap: 8 }}>
                {[
                  { labelKey: 'paymentMethod.cash', value: summary.cashRevenue },
                  { labelKey: 'paymentMethod.card', value: summary.cardRevenue },
                  { labelKey: 'paymentMethod.transfer', value: summary.transferRevenue },
                ].map(({ labelKey, value }, index, arr) => (
                  <View key={labelKey} style={{ flex: 1, alignItems: 'center', borderRightWidth: index < arr.length - 1 ? 0.5 : 0, borderRightColor: border }}>
                    <Text style={{ fontSize: 11, color: mutedColor, marginBottom: 4 }}>{t(labelKey as any)}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: value > 0 ? textColor : mutedColor }}>{fmt(value)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Gastos por categoría */}
            {expenseSummary && expenseSummary.byCategory.length > 0 && (
              <>
                <Text style={{ color: mutedColor, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12, marginTop: 8 }}>{t('reports.expensesByCategory')}</Text>
                <View style={{ backgroundColor: bgElev, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: 'hidden', marginBottom: 16 }}>
                  {expenseSummary.byCategory.map((item, index) => {
                    const catColor = EXPENSE_CATEGORY_COLORS[item.category as ExpenseCategory] ?? '#6B7280';
                    const maxExp = expenseSummary.byCategory[0].total;
                    return (
                      <View key={item.category} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: index < expenseSummary.byCategory.length - 1 ? 0.5 : 0, borderBottomColor: border }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: catColor + '22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: catColor }} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }} numberOfLines={1}>{t(`expenseCategories.${item.category}` as any)}</Text>
                          <View style={{ height: 6, backgroundColor: border, borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                            <View style={{ width: `${(item.total / maxExp) * 100}%`, height: '100%', backgroundColor: catColor, borderRadius: 3 }} />
                          </View>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, flexShrink: 0 }}>{fmt(item.total)}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {topProducts.length > 0 && (
              <>
                <Text style={{ color: mutedColor, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12, marginTop: 8 }}>{t('reports.topProducts')}</Text>
                <View style={{ backgroundColor: bgElev, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
                  {topProducts.map((product, index) => (
                    <View key={product.product_name} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: index < topProducts.length - 1 ? 0.5 : 0, borderBottomColor: border }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: soft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }} numberOfLines={1}>{product.product_name}</Text>
                        <View style={{ height: 6, backgroundColor: border, borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                          <View style={{ width: `${(product.totalQuantity / maxQty) * 100}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{product.totalQuantity}</Text>
                        <Text style={{ fontSize: 12, color: mutedColor }}>{fmt(product.totalRevenue)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        ) : null}
      </ScrollView>

      <ExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        initialPeriod={reportPeriod}
        initialDateRange={reportDateRange}
        initialLabelIds={labelFilter.length > 0 ? labelFilter : undefined}
      />
    </SafeAreaView>
  );
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

function TabletExpenses() {
  const { t } = useTranslation();
  const { expenses, isLoading, fetchExpensesByRange, fetchExpenseById, selectedExpense, deleteExpense, clearSelected } = require('@/store/expenses-store').useExpensesStore();
  const { labels, fetchLabels } = useLabelsStore();
  const { color } = useAccentColor();
  const { fmt } = useCurrency();
  const dateLocale = useDateLocale();
  const dayHeaderFormat = useDayHeaderFormat();
  const { colorScheme } = useUIStore();

  const isDark = colorScheme === 'dark';
  const border = isDark ? '#332A26' : '#E8E0D8';
  const bg = isDark ? '#171311' : '#FAF7F4';
  const bgElev = isDark ? '#211C19' : '#FFFFFF';
  const textColor = isDark ? '#F4EDE7' : '#1F1815';
  const mutedColor = isDark ? '#B8ADA5' : '#6B5D54';
  const subtleColor = isDark ? '#7A6E66' : '#9A8A80';

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [labelFilter, setLabelFilter] = useState<number[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [dateRange, setDateRange] = useState(() => getDateRange('month'));
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useFocusEffect(useCallback(() => {
    fetchLabels();
    fetchExpensesByRange(dateRange.from, dateRange.to);
    return () => clearSelected();
  }, [fetchExpensesByRange, fetchLabels, clearSelected, dateRange]));

  useEffect(() => {
    fetchExpensesByRange(dateRange.from, dateRange.to);
  }, [dateRange]); // eslint-disable-line

  useEffect(() => {
    if (selectedId !== null) fetchExpenseById(selectedId);
  }, [selectedId, fetchExpenseById]);

  function selectExpense(id: number) {
    setSelectedId(id);
    fetchExpenseById(id);
  }

  function handleSelectPeriod(p: ReportPeriod) {
    setPeriod(p);
    if (p !== 'custom') setDateRange(getDateRange(p));
  }

  function handleCustomToChange(dateStr: string) {
    setCustomTo(dateStr);
    if (customFrom && dateStr) {
      setDateRange({
        from: new Date(`${customFrom}T00:00:00`).toISOString(),
        to: new Date(`${dateStr}T23:59:59`).toISOString(),
      });
    }
  }

  const groups = useMemo(() => {
    const filtered = expenses.filter((e: Expense) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (labelFilter.length > 0) {
        const expLabelIds = (e.labels ?? []).map((l: any) => l.id);
        if (!labelFilter.some((id) => expLabelIds.includes(id))) return false;
      }
      return true;
    });
    const map = new Map<string, Expense[]>();
    filtered.forEach((e: Expense) => {
      const key = format(new Date(e.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return [...map.entries()].map(([key, dayExpenses]) => {
      const d = new Date((dayExpenses[0] as Expense).date);
      let label = '';
      if (isToday(d)) label = t('common.today');
      else if (isYesterday(d)) label = `${t('common.yesterday')} · ${format(d, 'EEE d MMM', { locale: dateLocale })}`;
      else label = format(d, dayHeaderFormat, { locale: dateLocale });
      return { key, label, expenses: dayExpenses as Expense[], total: (dayExpenses as Expense[]).reduce((s, e) => s + e.amount, 0) };
    });
  }, [expenses, categoryFilter, labelFilter, dateLocale, dayHeaderFormat, t]);

  const totalExpenses = groups.reduce((s, g) => s + g.total, 0);
  const totalCount = groups.reduce((s, g) => s + g.expenses.length, 0);

  function handleDelete(id: number) {
    Alert.alert(t('expenses.deleteTitle'), t('expenses.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteExpense(id); setSelectedId(null); } },
    ]);
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Master list */}
      <View style={{ width: 380, flexShrink: 0, borderRightWidth: 0.5, borderRightColor: border, backgroundColor: bgElev }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: textColor, letterSpacing: -0.5 }}>{t('tabs.expenses')}</Text>
              <Pressable
                onPress={() => router.push('/expenses/new')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: color }}
                className="active:opacity-80"
              >
                <IconSymbol name="plus" size={15} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{t('expenses.new')}</Text>
              </Pressable>
            </View>

            {/* DateRangePicker */}
            <DateRangePicker
              selected={period}
              customFrom={customFrom}
              customTo={customTo}
              onSelectPeriod={handleSelectPeriod}
              onCustomFromChange={(v) => setCustomFrom(v)}
              onCustomToChange={handleCustomToChange}
            />

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              <View style={{ flex: 1, backgroundColor: '#EF444422', borderRadius: 12, borderWidth: 1, borderColor: '#EF444444', padding: 10 }}>
                <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>{t('expenses.totalExpenses')}</Text>
                <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '700' }} numberOfLines={1}>{fmt(totalExpenses)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: bgElev, borderRadius: 12, borderWidth: 1, borderColor: border, padding: 10 }}>
                <Text style={{ color: mutedColor, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>{t('expenses.title')}</Text>
                <Text style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>{totalCount}</Text>
              </View>
            </View>

            {/* Category filter chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              <Pressable onPress={() => setCategoryFilter('all')}
                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: categoryFilter === 'all' ? color : bgElev, borderWidth: 1, borderColor: categoryFilter === 'all' ? color : border }}
                className="active:opacity-70"
              >
                <Text style={{ fontSize: 11.5, fontWeight: '600', color: categoryFilter === 'all' ? '#fff' : textColor }}>{t('expenses.filterAll')}</Text>
              </Pressable>
              {EXPENSE_CATEGORIES.filter((cat) => expenses.some((e: Expense) => e.category === cat.key)).map((cat) => {
                const isActive = categoryFilter === cat.key;
                const catColor = EXPENSE_CATEGORY_COLORS[cat.key];
                return (
                  <Pressable key={cat.key} onPress={() => setCategoryFilter(cat.key)}
                    style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: isActive ? catColor : catColor + '22', borderWidth: 1, borderColor: isActive ? catColor : catColor + '44' }}
                    className="active:opacity-70"
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: '600', color: isActive ? '#fff' : catColor }}>{cat.emoji} {t(`expenseCategories.${cat.key}` as any)}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Label filter */}
            {labels.length > 0 && (
              <View style={{ marginBottom: 10 }}>
                <LabelFilterBar labels={labels} selectedIds={labelFilter} onChange={setLabelFilter} />
              </View>
            )}
          </ScrollView>

          {isLoading && expenses.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={color} /></View>
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(g) => g.key}
              contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
              ListEmptyComponent={
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: mutedColor, fontSize: 14, textAlign: 'center' }}>{t('expenses.empty.title')}</Text>
                </View>
              }
              renderItem={({ item: group }) => (
                <View style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4, paddingBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.4 }}>{group.label}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: mutedColor }}>{group.expenses.length} · {fmt(group.total)}</Text>
                  </View>
                  <View style={{ backgroundColor: bg, borderRadius: 12, borderWidth: 0.5, borderColor: border, overflow: 'hidden' }}>
                    {group.expenses.map((expense, index) => {
                      const catColor = EXPENSE_CATEGORY_COLORS[expense.category as ExpenseCategory] ?? '#6B7280';
                      const meta = EXPENSE_CATEGORIES.find((c) => c.key === expense.category);
                      const isActive = expense.id === selectedId;
                      return (
                        <Pressable
                          key={expense.id}
                          onPress={() => selectExpense(expense.id)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: isActive ? catColor + '18' : 'transparent', borderBottomWidth: index < group.expenses.length - 1 ? 0.5 : 0, borderBottomColor: border }}
                          className="active:opacity-70"
                        >
                          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: catColor + '22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Text style={{ fontSize: 16 }}>{meta?.emoji ?? '⋯'}</Text>
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontSize: 13.5, fontWeight: '600', color: textColor }} numberOfLines={1}>{t(`expenseCategories.${expense.category}` as any)}</Text>
                            {expense.notes && <Text style={{ fontSize: 12, color: mutedColor, marginTop: 1 }} numberOfLines={1}>{expense.notes}</Text>}
                          </View>
                          <Text style={{ fontSize: 13.5, fontWeight: '700', color: catColor, flexShrink: 0 }}>{fmt(expense.amount)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </View>

      {/* Detail pane */}
      <View style={{ flex: 1, backgroundColor: bg }}>
        {selectedExpense ? (
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={{ padding: 32, paddingBottom: 60, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
              {(() => {
                const catColor = EXPENSE_CATEGORY_COLORS[selectedExpense.category as ExpenseCategory] ?? '#6B7280';
                const meta = EXPENSE_CATEGORIES.find((c) => c.key === selectedExpense.category);
                return (
                  <>
                    <View style={{ backgroundColor: catColor, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 }}>
                      <Text style={{ fontSize: 48, marginBottom: 8 }}>{meta?.emoji ?? '⋯'}</Text>
                      <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700' }}>{fmt(selectedExpense.amount)}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 }}>{t(`expenseCategories.${selectedExpense.category}` as any)}</Text>
                    </View>
                    <View style={{ backgroundColor: bgElev, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: 'hidden', marginBottom: 20 }}>
                      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: selectedExpense.notes ? 0.5 : 0, borderBottomColor: border }}>
                        <Text style={{ fontSize: 11, color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>{t('expenseForm.date')}</Text>
                        <Text style={{ fontSize: 15, color: textColor }}>{formatDate(selectedExpense.date, dateLocale)}</Text>
                      </View>
                      {selectedExpense.notes && (
                        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                          <Text style={{ fontSize: 11, color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>{t('expenseForm.notesLabel').replace(' (opcional)', '')}</Text>
                          <Text style={{ fontSize: 15, color: textColor }}>{selectedExpense.notes}</Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleDelete(selectedExpense.id)}
                      style={{ paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF444444' }}
                      className="active:opacity-70"
                    >
                      <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 15 }}>{t('expenses.deleteButton')}</Text>
                    </Pressable>
                  </>
                );
              })()}
            </ScrollView>
          </SafeAreaView>
        ) : (
          <EmptyDetailHint icon="minus.circle.fill" label={t('expenses.selectHint')} color={mutedColor} subtleColor={mutedColor} />
        )}
      </View>
    </View>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function TabletSettings() {
  // Re-uses the existing SettingsScreen content inline
  const SettingsScreen = require('@/app/(tabs)/settings').default;
  return <SettingsScreen />;
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export function TabletLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('orders');

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <TabletSidebar activeTab={activeTab} onTab={setActiveTab} />
      <View style={{ flex: 1 }}>
        {activeTab === 'orders' && <TabletOrders />}
        {activeTab === 'history' && <TabletHistory />}
        {activeTab === 'catalog' && <TabletCatalog />}
        {activeTab === 'reports' && <TabletReports />}
        {activeTab === 'expenses' && <TabletExpenses />}
        {activeTab === 'settings' && <TabletSettings />}
      </View>
    </View>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SummaryCell({ label, value, accent, active, onPress, color, soft, isDark, border, textColor, mutedColor, bgElev }: {
  label: string; value: string; accent?: boolean; active?: boolean; onPress?: () => void;
  color: string; soft: string; isDark: boolean; border: string;
  textColor: string; mutedColor: string; bgElev: string;
}) {
  const isHighlighted = accent || active;
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, backgroundColor: isHighlighted ? soft : bgElev, borderRadius: 12, padding: 10, borderWidth: isHighlighted ? 0 : 1, borderColor: border, minHeight: 52 }}
      className="active:opacity-70"
    >
      <Text style={{ fontSize: 10, fontWeight: '600', color: isHighlighted ? color : mutedColor, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }} numberOfLines={1}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: isHighlighted ? color : textColor, letterSpacing: -0.4 }} numberOfLines={1}>{value}</Text>
    </Pressable>
  );
}

function OrderListRow({ order, labels, active, onPress, color, soft, isDark, border, textColor, mutedColor }: {
  order: Order; labels: import('@/types').Label[]; active: boolean; onPress: () => void;
  color: string; soft: string; isDark: boolean; border: string; textColor: string; mutedColor: string;
}) {
  const { fmt } = useCurrency();
  const initials = order.client_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={{ padding: 12, backgroundColor: active ? soft : 'transparent', borderRadius: 12, marginBottom: 4 }}
      className="active:opacity-70"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: active ? color : soft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : color }}>{initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, letterSpacing: -0.2 }} numberOfLines={1}>{order.client_name}</Text>
          <Text style={{ fontSize: 12, color: mutedColor, marginTop: 1 }}>{format(new Date(order.created_at), 'HH:mm')}</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{fmt(order.total)}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', alignItems: 'center', paddingLeft: 46, marginTop: 6 }}>
        <DeliveryStatusBadge status={order.delivery_status} />
        <PaymentStatusBadge status={order.payment_status} />
        {labels.slice(0, 2).map((l) => <LabelChip key={l.id} label={l} size="sm" />)}
        {labels.length > 2 && <Text style={{ fontSize: 11, color: mutedColor, fontWeight: '600' }}>+{labels.length - 2}</Text>}
      </View>
    </Pressable>
  );
}

function OrderDetailContent({ order, items, labels, onEdit, onDelete, onToggleDelivery, onTogglePayment, readOnly = false, color, soft, isDark, fmt, border, textColor, mutedColor, subtleColor, successColor, warnColor, dateLocale }: any) {
  const { t } = useTranslation();
  const dateFormat = useDateFormat();
  const initials = order.client_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const successBg = isDark ? '#1A2A1C' : '#E5F2E4';
  const warnBg = isDark ? '#2B2010' : '#FBF1D9';
  const balance = order.total - order.advance_payment;

  const PAYMENT_METHOD_ICONS: Record<string, string> = {
    cash: 'banknote.fill', card: 'creditcard.fill', transfer: 'iphone',
  };
  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: t('paymentMethod.cash'), card: t('paymentMethod.card'), transfer: t('paymentMethod.transfer'),
  };

  return (
    <View>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: soft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color }}>{initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: -0.5 }}>{order.client_name}</Text>
          <Text style={{ fontSize: 13, color: mutedColor, marginTop: 3 }}>
            {format(new Date(order.created_at), 'HH:mm · d MMM yyyy')}
            {order.has_delivery === 1 ? ` · ${t('orderDetail.delivery')}` : ''}
          </Text>
          {labels?.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {labels.map((l: any) => <LabelChip key={l.id} label={l} size="md" />)}
            </View>
          )}
        </View>
        {!readOnly && onEdit && (
          <Pressable onPress={onEdit} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: border }} className="active:opacity-70">
            <IconSymbol name="pencil" size={15} color={textColor} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{t('common.edit')}</Text>
          </Pressable>
        )}
      </View>

      {/* Total + status */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <View style={{ flex: 1, backgroundColor: color, borderRadius: 16, padding: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 }}>{t('common.total')}</Text>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700', letterSpacing: -0.8, marginTop: 2 }}>{fmt(order.total)}</Text>
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Pressable onPress={!readOnly ? onToggleDelivery : undefined}
            style={{ flex: 1, backgroundColor: order.delivery_status === 'delivered' ? successBg : warnBg, borderRadius: 12, padding: 12, alignItems: 'center', flexDirection: 'row', gap: 6 }}
            className={readOnly ? '' : 'active:opacity-70'}
          >
            <IconSymbol name="shippingbox.fill" size={16} color={order.delivery_status === 'delivered' ? successColor : warnColor} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: order.delivery_status === 'delivered' ? successColor : warnColor }}>
              {order.delivery_status === 'delivered' ? t('common.delivered') : t('common.pending')}
            </Text>
          </Pressable>
          <Pressable onPress={!readOnly ? onTogglePayment : undefined}
            style={{ flex: 1, backgroundColor: order.payment_status === 'paid' ? successBg : (isDark ? '#2E1612' : '#FBE5E0'), borderRadius: 12, padding: 12, alignItems: 'center', flexDirection: 'row', gap: 6 }}
            className={readOnly ? '' : 'active:opacity-70'}
          >
            <IconSymbol name="checkmark.circle.fill" size={16} color={order.payment_status === 'paid' ? successColor : (isDark ? '#E97864' : '#C24A38')} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: order.payment_status === 'paid' ? successColor : (isDark ? '#E97864' : '#C24A38') }}>
              {order.payment_status === 'paid' ? t('common.paidSingular') : t('common.notPaid')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Address */}
      {order.has_delivery === 1 && order.client_address ? (
        <DetailBlock title={t('orderDetail.sectionClient')} border={border} isDark={isDark}>
          <DetailRow icon="location.fill" label={order.client_address} border={border} textColor={textColor} mutedColor={mutedColor} isLast />
        </DetailBlock>
      ) : null}

      {/* Items */}
      <DetailBlock title={t('orderDetail.sectionProducts')} border={border} isDark={isDark}>
        {items.map((item: any, i: number) => (
          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < items.length - 1 ? 0.5 : 0, borderBottomColor: border }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: soft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text style={{ fontSize: 22 }}>🧁</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }} numberOfLines={1}>{item.product_name}</Text>
              <Text style={{ fontSize: 12, color: mutedColor, marginTop: 1 }}>{item.quantity} × {fmt(item.product_price)}</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{fmt(item.subtotal)}</Text>
          </View>
        ))}
        <View style={{ borderTopWidth: 0.5, borderTopColor: border, paddingHorizontal: 16, paddingVertical: 12, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: mutedColor }}>{t('common.subtotal')}</Text>
            <Text style={{ fontSize: 13, color: textColor }}>{fmt(order.subtotal)}</Text>
          </View>
          {order.has_delivery === 1 && order.shipping_cost > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: mutedColor }}>{t('common.shipping')}</Text>
              <Text style={{ fontSize: 13, color: textColor }}>{fmt(order.shipping_cost)}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{t('common.total')}</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color }}>{fmt(order.total)}</Text>
          </View>
        </View>
      </DetailBlock>

      {/* Scheduled */}
      {order.delivery_date ? (
        <DetailBlock title={t('orderDetail.sectionScheduled')} border={border} isDark={isDark}>
          <DetailRow icon="calendar" label={t('orderDetail.deliveryLabel', { date: formatDate(order.delivery_date, dateLocale, dateFormat) })} border={border} textColor={textColor} mutedColor={mutedColor} isLast={order.advance_payment === 0} />
          {order.advance_payment > 0 && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: border }}>
                <Text style={{ fontSize: 13, color: mutedColor }}>{t('orderDetail.advanceReceived')}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>{fmt(order.advance_payment)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{t('orderDetail.balancePending')}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: balance > 0 ? warnColor : successColor }}>{fmt(balance)}</Text>
              </View>
            </>
          )}
        </DetailBlock>
      ) : null}

      {/* Payment */}
      <DetailBlock title={t('orderDetail.sectionPayment')} border={border} isDark={isDark}>
        <DetailRow icon={PAYMENT_METHOD_ICONS[order.payment_method] as any} label={PAYMENT_METHOD_LABELS[order.payment_method]} border={border} textColor={textColor} mutedColor={mutedColor} isLast />
      </DetailBlock>

      {/* Notes */}
      {order.notes ? (
        <DetailBlock title={t('orderDetail.sectionNotes')} border={border} isDark={isDark}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontSize: 14, color: textColor, lineHeight: 20 }}>{order.notes}</Text>
          </View>
        </DetailBlock>
      ) : null}

      {/* Delete */}
      {!readOnly && onDelete && (
        <Pressable onPress={onDelete} style={{ borderWidth: 1, borderColor: isDark ? '#E97864' : '#C24A38', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 }} className="active:opacity-70">
          <Text style={{ color: isDark ? '#E97864' : '#C24A38', fontWeight: '600', fontSize: 14 }}>{t('orderDetail.deleteButton')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function DetailBlock({ title, children, border, isDark }: { title: string; children: React.ReactNode; border: string; isDark: boolean }) {
  const textColor = isDark ? '#B8ADA5' : '#6B5D54';
  const bgElev = isDark ? '#211C19' : '#FFFFFF';
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: textColor, textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 4, marginBottom: 6 }}>{title}</Text>
      <View style={{ backgroundColor: bgElev, borderRadius: 16, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

function DetailRow({ icon, label, isLast, border, textColor, mutedColor }: { icon: string; label: string; isLast?: boolean; border: string; textColor: string; mutedColor: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: border }}>
      <IconSymbol name={icon as any} size={18} color={mutedColor} />
      <Text style={{ flex: 1, fontSize: 14, color: textColor }}>{label}</Text>
    </View>
  );
}

function CatalogEmptyPane({ products, fmt, color, soft, border, textColor, mutedColor, subtleColor, surfaceMuted, bgElev, bg, priceMin, priceAvg, priceMax, priciest, cheapest, onNew, onSelect }: any) {
  const { t } = useTranslation();
  const count = products.length;

  return (
    <View style={{ gap: 20 }}>
      {/* Header */}
      <View>
        <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('catalog.yourCatalog')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: 32, fontWeight: '700', color: textColor, letterSpacing: -0.8, lineHeight: 36 }}>{count}</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: mutedColor, letterSpacing: -0.2 }}>{count === 1 ? t('catalog.product') : t('catalog.products')}</Text>
        </View>
      </View>

      {/* Price stats */}
      {count > 0 && (
        <View style={{ backgroundColor: bg, borderWidth: 0.5, borderColor: border, borderRadius: 14, padding: 14 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>{t('catalog.prices')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCell label={t('catalog.priceMin')} value={fmt(priceMin)} textColor={textColor} mutedColor={mutedColor} />
            <StatCell label={t('catalog.priceAvg')} value={fmt(priceAvg)} textColor={color} mutedColor={mutedColor} accent />
            <StatCell label={t('catalog.priceMax')} value={fmt(priceMax)} textColor={textColor} mutedColor={mutedColor} />
          </View>
        </View>
      )}

      {/* Highlights */}
      {count > 0 && (
        <View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, paddingHorizontal: 2 }}>{t('catalog.highlights')}</Text>
          <View style={{ gap: 8 }}>
            {priciest && (
              <HighlightRow product={priciest} caption={t('catalog.mostExpensive')} fmt={fmt} soft={soft} color={color} bg={bg} border={border} textColor={textColor} mutedColor={mutedColor} onPress={() => onSelect(priciest.id)} />
            )}
            {cheapest && cheapest.id !== priciest?.id && (
              <HighlightRow product={cheapest} caption={t('catalog.mostEconomical')} fmt={fmt} soft={soft} color={color} bg={bg} border={border} textColor={textColor} mutedColor={mutedColor} onPress={() => onSelect(cheapest.id)} />
            )}
          </View>
        </View>
      )}

      {/* Hint */}
      <View style={{ padding: 12, backgroundColor: bg, borderWidth: 0.5, borderStyle: 'dashed', borderColor: border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <IconSymbol name="tag.fill" size={18} color={mutedColor} />
        <Text style={{ fontSize: 12, color: mutedColor, lineHeight: 18, flex: 1 }}>{t('catalog.selectHint')}</Text>
      </View>
    </View>
  );
}

function StatCell({ label, value, accent, textColor, mutedColor }: { label: string; value: string; accent?: boolean; textColor: string; mutedColor: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: mutedColor, letterSpacing: 0.2, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, letterSpacing: -0.3 }}>{value}</Text>
    </View>
  );
}

function HighlightRow({ product, caption, fmt, soft, color, bg, border, textColor, mutedColor, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 12, backgroundColor: bg, borderWidth: 0.5, borderColor: border }} className="active:opacity-70">
      <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: soft, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Text style={{ fontSize: 24 }}>{product.emoji ?? '🧁'}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 10.5, fontWeight: '700', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.4 }}>{caption}</Text>
        <Text style={{ fontSize: 13.5, fontWeight: '600', color: textColor, letterSpacing: -0.2, marginTop: 1 }} numberOfLines={1}>{product.name}</Text>
      </View>
      <Text style={{ fontSize: 13.5, fontWeight: '700', color }}>{fmt(product.price)}</Text>
    </Pressable>
  );
}

function ActionRow({ icon, label, sublabel, primary, color, soft, bg, border, textColor, mutedColor, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: primary ? soft : bg, borderWidth: 0.5, borderColor: primary ? 'transparent' : border }} className="active:opacity-70">
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: primary ? color : `${color}22`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <IconSymbol name={icon} size={16} color={primary ? '#fff' : color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13.5, fontWeight: '600', color: primary ? color : textColor, letterSpacing: -0.2 }}>{label}</Text>
        <Text style={{ fontSize: 11.5, color: mutedColor, marginTop: 1 }}>{sublabel}</Text>
      </View>
    </Pressable>
  );
}

function EmptyDetailHint({ icon, label, color, subtleColor }: { icon: string; label: string; color: string; subtleColor: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <IconSymbol name={icon as any} size={42} color={subtleColor} />
      <Text style={{ fontSize: 14, color }}>{label}</Text>
    </View>
  );
}
