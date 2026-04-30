import { useFocusEffect, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpenseRow } from '@/components/expenses/ExpenseRow';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_COLORS } from '@/constants/expense-categories';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useCurrency } from '@/hooks/use-currency';
import { useDateLocale, useDayHeaderFormat } from '@/hooks/use-locale';
import { useExpensesStore } from '@/store/expenses-store';
import { useUIStore } from '@/store/ui-store';
import type { Expense, ExpenseCategory } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import type { Locale } from 'date-fns';

interface DayGroup {
  dateKey: string;
  label: string;
  expenses: Expense[];
  dayTotal: number;
}

function formatDayLabel(isoString: string, today: string, yesterday: string, locale: Locale, dayHeaderFormat: string): string {
  const date = new Date(isoString);
  if (isToday(date)) return today;
  if (isYesterday(date)) return `${yesterday} · ${format(date, 'EEE d MMM', { locale })}`;
  return format(date, dayHeaderFormat, { locale });
}

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const { expenses, isLoading, fetchExpensesByRange } = useExpensesStore();
  const { colorScheme } = useUIStore();
  const { color, soft } = useAccentColor();
  const { fmt } = useCurrency();
  const dateLocale = useDateLocale();
  const dayHeaderFormat = useDayHeaderFormat();

  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');

  const iconColor = colorScheme === 'dark' ? '#7A6E66' : '#9A8A80';

  useFocusEffect(
    useCallback(() => {
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      const from = new Date();
      from.setDate(from.getDate() - 90);
      from.setHours(0, 0, 0, 0);
      fetchExpensesByRange(from.toISOString(), to.toISOString());
    }, [fetchExpensesByRange])
  );

  const todayStr = t('common.today');
  const yesterdayStr = t('common.yesterday');

  const groups = useMemo<DayGroup[]>(() => {
    const filtered = categoryFilter === 'all'
      ? expenses
      : expenses.filter((e) => e.category === categoryFilter);

    const map = new Map<string, Expense[]>();
    filtered.forEach((e) => {
      const d = new Date(e.date);
      const dateKey = format(d, 'yyyy-MM-dd');
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(e);
    });

    return [...map.entries()].map(([dateKey, dayExpenses]) => ({
      dateKey,
      label: formatDayLabel(dayExpenses[0].date, todayStr, yesterdayStr, dateLocale, dayHeaderFormat),
      expenses: dayExpenses,
      dayTotal: dayExpenses.reduce((s, e) => s + e.amount, 0),
    }));
  }, [expenses, categoryFilter, todayStr, yesterdayStr, dateLocale, dayHeaderFormat]);

  const totalExpenses = groups.reduce((s, g) => s + g.dayTotal, 0);
  const totalCount = expenses.filter((e) => categoryFilter === 'all' || e.category === categoryFilter).length;

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={[]}>
      {isLoading && expenses.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={color} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.dateKey}
          contentContainerClassName="px-4 pt-4 pb-10"
          ListHeaderComponent={
            <View className="mb-2">
              {/* Stats */}
              <View className="flex-row gap-3 mb-4">
                <View style={{ backgroundColor: '#EF444422' }} className="flex-1 rounded-2xl px-3 py-2.5">
                  <Text style={{ color: '#EF4444' }} className="text-xs font-semibold uppercase tracking-wider mb-0.5">
                    {t('expenses.totalExpenses')}
                  </Text>
                  <Text style={{ color: '#EF4444' }} className="text-xl font-bold" numberOfLines={1}>
                    {fmt(totalExpenses)}
                  </Text>
                </View>
                <View className="flex-1 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl px-3 py-2.5">
                  <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-0.5">
                    {t('expenses.title')}
                  </Text>
                  <Text className="text-xl font-bold text-content dark:text-content-dark">{totalCount}</Text>
                </View>
              </View>

              {/* Filtro por categoría */}
              <View className="flex-row flex-wrap gap-2 mb-4">
                {/* Chip "Todos" */}
                <Pressable
                  onPress={() => setCategoryFilter('all')}
                  style={categoryFilter === 'all' ? { backgroundColor: color, borderColor: color } : undefined}
                  className={`rounded-full px-3.5 py-1.5 border ${categoryFilter === 'all' ? 'border-transparent' : 'bg-surface-elevated dark:bg-surface-elevated-dark border-border dark:border-border-dark'}`}
                >
                  <Text className={`text-sm font-semibold ${categoryFilter === 'all' ? 'text-white' : 'text-content dark:text-content-dark'}`}>
                    {t('expenses.filterAll')}
                  </Text>
                </Pressable>

                {/* Chips de categorías que tienen gastos */}
                {EXPENSE_CATEGORIES.filter((cat) => expenses.some((e) => e.category === cat.key)).map((cat) => {
                  const isActive = categoryFilter === cat.key;
                  const catColor = EXPENSE_CATEGORY_COLORS[cat.key];
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => setCategoryFilter(cat.key)}
                      style={{
                        backgroundColor: isActive ? catColor : catColor + '22',
                        borderColor: isActive ? catColor : catColor + '44',
                        borderWidth: 1,
                      }}
                      className="flex-row items-center gap-1 rounded-full px-3 py-1.5 active:opacity-70"
                    >
                      <Text className="text-sm">{cat.emoji}</Text>
                      <Text className="text-sm font-medium" style={{ color: isActive ? '#fff' : catColor }}>
                        {t(`expenseCategories.${cat.key}` as any)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          renderItem={({ item: group }) => (
            <View className="mb-5">
              <View className="flex-row items-baseline justify-between px-1 mb-2">
                <Text className="text-xs font-bold text-content dark:text-content-dark capitalize tracking-wider">
                  {group.label}
                </Text>
                <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark">
                  {group.expenses.length} · {fmt(group.dayTotal)}
                </Text>
              </View>

              <View className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl overflow-hidden">
                {group.expenses.map((expense, index) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    fmt={fmt}
                    isLast={index === group.expenses.length - 1}
                    onPress={() => router.push(`/expenses/${expense.id}`)}
                  />
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View className="flex-1 items-center justify-center py-20">
                <IconSymbol name="minus.circle.fill" size={40} color={iconColor} style={{ marginBottom: 12 }} />
                <Text className="text-base font-semibold text-content dark:text-content-dark text-center">
                  {t('expenses.empty.title')}
                </Text>
                <Text className="text-sm text-content-muted dark:text-content-muted-dark text-center mt-1 px-8">
                  {t('expenses.empty.subtitle')}
                </Text>
                <Pressable
                  onPress={() => router.push('/expenses/new')}
                  style={{ backgroundColor: color }}
                  className="mt-5 px-6 py-3 rounded-2xl active:opacity-80"
                >
                  <Text className="text-white font-semibold">{t('expenses.empty.cta')}</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      {expenses.length > 0 && (
        <Pressable
          onPress={() => router.push('/expenses/new')}
          style={{ backgroundColor: color, bottom: 24, right: 20 }}
          className="absolute w-14 h-14 rounded-full items-center justify-center active:opacity-80 shadow-lg"
        >
          <IconSymbol name="plus" size={28} color="#fff" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}
