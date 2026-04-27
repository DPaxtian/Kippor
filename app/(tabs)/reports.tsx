import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import { SparklineChart } from '@/components/reports/SparklineChart';
import { getDatabase } from '@/db/database';
import { getSalesSummary, getTopProducts, getWeeklyRevenue, getPreviousPeriodRevenue } from '@/db/reports';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency } from '@/utils/format';
import { getDateRange } from '@/utils/dates';
import type { ProductStat, ReportPeriod, SalesSummary } from '@/types';

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: 'hoy', week: 'esta semana', month: 'este mes', year: 'este año', custom: 'período',
};
const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function ReportsScreen() {
  const { reportPeriod, reportDateRange, setReportPeriod, setReportDateRange } = useUIStore();
  const { color, soft } = useAccentColor();

  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<number[]>(Array(7).fill(0));
  const [previousRevenue, setPreviousRevenue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => { loadData(); }, [reportDateRange]); // eslint-disable-line

  async function loadData() {
    setIsLoading(true);
    try {
      const db = await getDatabase();
      const [s, products, weekly, prevRev] = await Promise.all([
        getSalesSummary(db, reportDateRange.from, reportDateRange.to),
        getTopProducts(db, reportDateRange.from, reportDateRange.to),
        getWeeklyRevenue(db, new Date(reportDateRange.to)),
        getPreviousPeriodRevenue(db, reportDateRange.from, reportDateRange.to),
      ]);
      setSummary(s); setTopProducts(products); setWeeklyRevenue(weekly); setPreviousRevenue(prevRev);
    } catch (e) { console.error('Error loading reports:', e); }
    finally { setIsLoading(false); }
  }

  function handleSelectPeriod(period: ReportPeriod) {
    setReportPeriod(period);
    if (period !== 'custom') setReportDateRange(getDateRange(period));
  }

  function handleCustomDateApply() {
    if (customFrom && customTo) {
      setReportDateRange({
        from: new Date(`${customFrom}T00:00:00`).toISOString(),
        to: new Date(`${customTo}T23:59:59`).toISOString(),
      });
    }
  }

  const maxQty = topProducts.length > 0 ? topProducts[0].totalQuantity : 1;

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      <ScrollView contentContainerClassName="p-4 pb-8">
        <DateRangePicker
          selected={reportPeriod} customFrom={customFrom} customTo={customTo}
          onSelectPeriod={handleSelectPeriod}
          onCustomFromChange={(v) => { setCustomFrom(v); }}
          onCustomToChange={(v) => { setCustomTo(v); handleCustomDateApply(); }}
        />

        {isLoading ? (
          <View className="py-16 items-center"><ActivityIndicator size="large" color={color} /></View>
        ) : summary ? (
          <>
            {/* Hero card */}
            <View style={{ backgroundColor: color }} className="rounded-2xl p-5 mb-4">
              <Text className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                Ingresos {PERIOD_LABELS[reportPeriod]}
              </Text>
              <Text className="text-white text-4xl font-bold tracking-tight mb-1">
                {formatCurrency(summary.totalRevenue)}
              </Text>
              {previousRevenue > 0 || summary.totalRevenue > 0 ? (
                <Text className="text-white/60 text-sm mb-4">
                  {previousRevenue === 0
                    ? 'Sin datos del período anterior'
                    : (() => {
                        const pct = ((summary.totalRevenue - previousRevenue) / previousRevenue) * 100;
                        const sign = pct >= 0 ? '+' : '';
                        return `${sign}${pct.toFixed(0)}% vs período anterior`;
                      })()
                  }
                </Text>
              ) : (
                <Text className="text-white/60 text-sm mb-4">Sin datos anteriores</Text>
              )}
              <SparklineChart data={weeklyRevenue} labels={WEEK_LABELS} />
            </View>

            {/* 2×2 grid */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl p-4">
                <Text className="text-content-muted dark:text-content-muted-dark text-xs font-semibold uppercase tracking-wider mb-1">Pedidos</Text>
                <Text className="text-content dark:text-content-dark text-2xl font-bold">{summary.totalOrders}</Text>
              </View>
              <View className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl p-4">
                <Text className="text-content-muted dark:text-content-muted-dark text-xs font-semibold uppercase tracking-wider mb-1">Ticket prom.</Text>
                <Text className="text-content dark:text-content-dark text-2xl font-bold" numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(summary.avgOrderValue)}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1 bg-warning-soft dark:bg-warning-soft-dark border border-warning/20 dark:border-warning-dark/20 rounded-2xl p-4">
                <Text className="text-warning dark:text-warning-dark text-xs font-semibold uppercase tracking-wider mb-1">Por cobrar</Text>
                <Text className="text-warning dark:text-warning-dark text-2xl font-bold">{summary.unpaidCount}</Text>
                <Text className="text-warning/70 dark:text-warning-dark/70 text-xs mt-0.5">pedidos pendientes</Text>
              </View>
              <View className="flex-1 bg-warning-soft dark:bg-warning-soft-dark border border-warning/20 dark:border-warning-dark/20 rounded-2xl p-4">
                <Text className="text-warning dark:text-warning-dark text-xs font-semibold uppercase tracking-wider mb-1">Por entregar</Text>
                <Text className="text-warning dark:text-warning-dark text-2xl font-bold">{summary.pendingDeliveries}</Text>
                <Text className="text-warning/70 dark:text-warning-dark/70 text-xs mt-0.5">envíos pendientes</Text>
              </View>
            </View>

            {/* Top products */}
            {topProducts.length > 0 && (
              <>
                <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-3">
                  Más vendidos
                </Text>
                <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden">
                  {topProducts.map((product, index) => (
                    <View
                      key={product.product_name}
                      className={`flex-row items-center px-4 py-3 gap-3 ${index < topProducts.length - 1 ? 'border-b border-border dark:border-border-dark' : ''}`}
                    >
                      <View style={{ backgroundColor: soft }} className="w-7 h-7 rounded-full items-center justify-center flex-shrink-0">
                        <Text style={{ color }} className="text-xs font-bold">{index + 1}</Text>
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-semibold text-content dark:text-content-dark" numberOfLines={1}>
                          {product.product_name}
                        </Text>
                        <View className="h-1.5 bg-border dark:bg-border-dark rounded-full mt-1.5 overflow-hidden">
                          <View style={{ width: `${(product.totalQuantity / maxQty) * 100}%`, backgroundColor: color }} className="h-full rounded-full" />
                        </View>
                      </View>
                      <View className="items-end flex-shrink-0">
                        <Text className="text-sm font-bold text-content dark:text-content-dark">{product.totalQuantity}</Text>
                        <Text className="text-xs text-content-subtle dark:text-content-subtle-dark">{formatCurrency(product.totalRevenue)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {summary.totalOrders === 0 && (
              <View className="items-center py-16">
                <Text className="text-content-muted dark:text-content-muted-dark text-base text-center">Sin ventas en este período.</Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
