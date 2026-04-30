import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LabelChip } from '@/components/labels/LabelChip';
import { LabelFilterBar } from '@/components/labels/LabelFilterBar';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useCurrency } from '@/hooks/use-currency';
import { useLabelsStore } from '@/store/labels-store';
import { useOrdersStore } from '@/store/orders-store';
import { useUIStore } from '@/store/ui-store';
import { formatShortDate } from '@/utils/format';
import type { Order } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import type { Locale } from 'date-fns';
import { useDateLocale, useDayHeaderFormat } from '@/hooks/use-locale';

type FilterKey = 'all' | 'paid' | 'unpaid';

interface DayGroup {
  dateKey: string;
  label: string;
  orders: Order[];
  dayTotal: number;
}

function formatDayLabel(isoString: string, today: string, yesterday: string, locale: Locale, dayHeaderFormat: string): string {
  const date = new Date(isoString);
  if (isToday(date)) return today;
  if (isYesterday(date)) return `${yesterday} · ${format(date, 'EEE d MMM', { locale })}`;
  return format(date, dayHeaderFormat, { locale });
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { orders, isLoading, fetchOrdersByRange } = useOrdersStore();
  const { labels, orderLabelsMap, fetchLabels, fetchLabelsForOrders } = useLabelsStore();
  const { colorScheme } = useUIStore();
  const { color, soft } = useAccentColor();
  const { fmt } = useCurrency();
  const dateLocale = useDateLocale();
  const dayHeaderFormat = useDayHeaderFormat();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [labelFilter, setLabelFilter] = useState<number[]>([]);

  const iconColor = colorScheme === 'dark' ? '#7A6E66' : '#9A8A80';

  useEffect(() => {
    // Carga los últimos 90 días
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 90);
    from.setHours(0, 0, 0, 0);
    fetchLabels();
    fetchOrdersByRange(from.toISOString(), to.toISOString()).then(() => {
      const ids = useOrdersStore.getState().orders.map((o) => o.id);
      fetchLabelsForOrders(ids);
    });
  }, []); // eslint-disable-line

  const todayStr = t('common.today');
  const yesterdayStr = t('common.yesterday');

  const groups = useMemo<DayGroup[]>(() => {
    const q = search.trim().toLowerCase();

    const filtered = orders.filter((o) => {
      if (filter === 'paid' && o.payment_status !== 'paid') return false;
      if (filter === 'unpaid' && o.payment_status !== 'unpaid') return false;
      if (labelFilter.length > 0) {
        const orderLabelIds = (orderLabelsMap[o.id] ?? []).map((l) => l.id);
        if (!labelFilter.some((id) => orderLabelIds.includes(id))) return false;
      }
      if (!q) return true;
      return o.client_name.toLowerCase().includes(q);
    });

    const map = new Map<string, Order[]>();
    filtered.forEach((o) => {
      const d = new Date(o.created_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(o);
    });

    return [...map.entries()].map(([dateKey, dayOrders]) => ({
      dateKey,
      label: formatDayLabel(dayOrders[0].created_at, todayStr, yesterdayStr, dateLocale, dayHeaderFormat),
      orders: dayOrders,
      dayTotal: dayOrders.reduce((s, o) => s + o.total, 0),
    }));
  }, [orders, search, filter, labelFilter, orderLabelsMap, todayStr, yesterdayStr]);

  const totalRevenue = groups.reduce((s, g) => s + g.dayTotal, 0);
  const totalCount = groups.reduce((s, g) => s + g.orders.length, 0);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t('history.filterAll') },
    { key: 'paid', label: t('history.filterPaid') },
    { key: 'unpaid', label: t('history.filterUnpaid') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={[]}>
      {isLoading && orders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={color} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.dateKey}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-4 pt-4 pb-10"
          ListHeaderComponent={
            <View className="mb-2">
              {/* Stats */}
              <View className="flex-row gap-3 mb-4">
                <View style={{ backgroundColor: soft }} className="flex-1 rounded-2xl px-3 py-2.5">
                  <Text style={{ color }} className="text-xs font-semibold uppercase tracking-wider mb-0.5">{t('history.totalRevenue')}</Text>
                  <Text style={{ color }} className="text-xl font-bold" numberOfLines={1}>{fmt(totalRevenue)}</Text>
                </View>
                <View className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl px-3 py-2.5">
                  <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-0.5">{t('history.totalOrders')}</Text>
                  <Text className="text-xl font-bold text-content dark:text-content-dark">{totalCount}</Text>
                </View>
              </View>

              {/* Search */}
              <View className="flex-row items-center gap-2 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-3 py-2.5 mb-3">
                <IconSymbol name="magnifyingglass" size={16} color={iconColor} />
                <AppTextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('history.searchPlaceholder')}
                  placeholderTextColor="#9A8A80"
                  className="flex-1 text-base text-content dark:text-content-dark"
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} className="active:opacity-60">
                    <IconSymbol name="xmark.circle.fill" size={16} color={iconColor} />
                  </Pressable>
                )}
              </View>

              {/* Filter chips */}
              <View className="flex-row gap-2 mb-4">
                {FILTERS.map(({ key, label }) => {
                  const active = filter === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setFilter(key)}
                      style={active ? { backgroundColor: color, borderColor: color } : undefined}
                      className={`rounded-full px-3.5 py-1.5 border ${active ? 'border-transparent' : 'bg-surface-elevated dark:bg-surface-elevated-dark border-border dark:border-border-dark'}`}
                    >
                      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-content dark:text-content-dark'}`}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Label filter */}
              <LabelFilterBar labels={labels} selectedIds={labelFilter} onChange={setLabelFilter} label={t('history.filterLabel')} />
            </View>
          }
          renderItem={({ item: group }) => (
            <View className="mb-5">
              {/* Day header */}
              <View className="flex-row items-baseline justify-between px-1 mb-2">
                <Text className="text-xs font-bold text-content dark:text-content-dark capitalize tracking-wider">
                  {group.label}
                </Text>
                <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark">
                  {group.orders.length} · {fmt(group.dayTotal)}
                </Text>
              </View>

              {/* Orders */}
              <View className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl overflow-hidden">
                {group.orders.map((order, index) => (
                  <HistoryRow
                    key={order.id}
                    order={order}
                    isLast={index === group.orders.length - 1}
                    fmt={fmt}
                    color={color}
                    soft={soft}
                    iconColor={iconColor}
                    onPress={() => router.push(`/orders/${order.id}`)}
                    orderLabels={orderLabelsMap[order.id] ?? []}
                  />
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View className="flex-1 items-center justify-center py-20">
                <IconSymbol name="magnifyingglass" size={36} color={iconColor} />
                <Text className="text-base font-semibold text-content dark:text-content-dark mt-3">{t('history.noResults')}</Text>
                <Text className="text-sm text-content-muted dark:text-content-muted-dark mt-1">{t('history.noResultsSubtitle')}</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function HistoryRow({ order, isLast, fmt, color, soft, iconColor, onPress, orderLabels }: {
  order: Order; isLast: boolean; fmt: (v: number) => string;
  color: string; soft: string; iconColor: string; onPress: () => void;
  orderLabels: import('@/types').Label[];
}) {
  const { t } = useTranslation();
  const initials = order.client_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const time = format(new Date(order.created_at), 'HH:mm');
  const unpaid = order.payment_status === 'unpaid';

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-3 active:opacity-60 ${!isLast ? 'border-b border-border dark:border-border-dark' : ''}`}
    >
      <View style={{ backgroundColor: soft }} className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0">
        <Text style={{ color }} className="text-sm font-bold">{initials}</Text>
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-semibold text-content dark:text-content-dark" numberOfLines={1}>
          {order.client_name}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-0.5">
          <Text className="text-xs text-content-muted dark:text-content-muted-dark">{time}</Text>
          {order.has_delivery === 1 && (
            <>
              <Text className="text-xs text-content-muted dark:text-content-muted-dark">·</Text>
              <IconSymbol name="shippingbox.fill" size={11} color={iconColor} />
            </>
          )}
        </View>
        {orderLabels.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-1.5">
            {orderLabels.map((label) => (
              <LabelChip key={label.id} label={label} size="sm" />
            ))}
          </View>
        )}
      </View>
      <View className="flex-row items-center gap-2 flex-shrink-0">
        {unpaid && (
          <View className="bg-error-soft dark:bg-error-soft-dark rounded-md px-1.5 py-0.5">
            <Text className="text-error dark:text-error-dark text-xs font-bold uppercase tracking-wide">{t('common.unpaid')}</Text>
          </View>
        )}
        <Text className="text-sm font-bold text-content dark:text-content-dark">{fmt(order.total)}</Text>
      </View>
      <IconSymbol name="chevron.right" size={14} color={iconColor} />
    </Pressable>
  );
}
