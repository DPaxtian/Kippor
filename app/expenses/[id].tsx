import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LabelChip } from '@/components/labels/LabelChip';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_COLORS } from '@/constants/expense-categories';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useCurrency } from '@/hooks/use-currency';
import { useDateFormat, useDateLocale } from '@/hooks/use-locale';
import { useExpensesStore } from '@/store/expenses-store';
import type { ExpenseCategory } from '@/types';
import { formatDate } from '@/utils/format';

export default function ExpenseDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { color } = useAccentColor();
  const { fmt } = useCurrency();
  const dateLocale = useDateLocale();
  const dateFormat = useDateFormat();
  const navigation = useNavigation();
  const { selectedExpense, isLoading, fetchExpenseById, deleteExpense, clearSelected } = useExpensesStore();

  useEffect(() => {
    fetchExpenseById(Number(id));
    return () => clearSelected();
  }, [id]); // eslint-disable-line

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push({ pathname: '/expenses/edit', params: { id } })}
          className="px-1 active:opacity-60"
        >
          <Text style={{ color }} className="text-base font-medium">{t('common.edit')}</Text>
        </Pressable>
      ),
    });
  }, [navigation, color, id]);

  function handleDelete() {
    Alert.alert(
      t('expenses.deleteTitle'),
      t('expenses.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => { await deleteExpense(Number(id)); router.back(); },
        },
      ]
    );
  }

  if (isLoading || !selectedExpense) {
    return (
      <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <ActivityIndicator />
      </View>
    );
  }

  const catColor = EXPENSE_CATEGORY_COLORS[selectedExpense.category as ExpenseCategory] ?? '#6B7280';
  const soft = catColor + '22';
  const meta = EXPENSE_CATEGORIES.find((c) => c.key === selectedExpense.category);

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <View style={{ backgroundColor: catColor }} className="mx-4 mt-6 rounded-2xl p-5 items-center mb-6">
          <Text className="text-4xl mb-2">{meta?.emoji ?? '⋯'}</Text>
          <Text className="text-white text-3xl font-bold">{fmt(selectedExpense.amount)}</Text>
          <Text className="text-white/80 text-sm mt-1">
            {t(`expenseCategories.${selectedExpense.category}` as any)}
          </Text>
        </View>

        {/* Detalles */}
        <View className="mx-4 bg-surface-elevated dark:bg-surface-elevated-dark rounded-2xl overflow-hidden border border-border dark:border-border-dark">
          <View className="px-4 py-3 border-b border-border dark:border-border-dark">
            <Text className="text-xs text-content-muted dark:text-content-muted-dark uppercase tracking-wide mb-1">
              {t('expenseForm.date')}
            </Text>
            <Text className="text-base text-content dark:text-content-dark">
              {formatDate(selectedExpense.date, dateLocale, dateFormat)}
            </Text>
          </View>

          {selectedExpense.notes && (
            <View className="px-4 py-3 border-b border-border dark:border-border-dark">
              <Text className="text-xs text-content-muted dark:text-content-muted-dark uppercase tracking-wide mb-1">
                {t('expenseForm.notesLabel').replace(' (opcional)', '')}
              </Text>
              <Text className="text-base text-content dark:text-content-dark">{selectedExpense.notes}</Text>
            </View>
          )}

          {selectedExpense.labels && selectedExpense.labels.length > 0 && (
            <View className="px-4 py-3">
              <Text className="text-xs text-content-muted dark:text-content-muted-dark uppercase tracking-wide mb-2">
                {t('orders.labels')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {selectedExpense.labels.map((label) => (
                  <LabelChip key={label.id} label={label} size="md" />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Eliminar */}
        <View className="mx-4 mt-6">
          <Pressable
            onPress={handleDelete}
            className="py-4 rounded-2xl items-center border border-red-300 dark:border-red-800 active:opacity-70"
          >
            <Text className="text-red-500 font-semibold text-base">{t('expenses.deleteButton')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
