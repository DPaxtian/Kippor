import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LabelChip } from '@/components/labels/LabelChip';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_COLORS } from '@/constants/expense-categories';
import { useDateLocale } from '@/hooks/use-locale';
import type { Expense, ExpenseCategory } from '@/types';
import { formatDateTime } from '@/utils/format';

interface ExpenseRowProps {
  expense: Expense;
  fmt: (amount: number) => string;
  onPress: () => void;
  isLast?: boolean;
}

export function ExpenseRow({ expense, fmt, onPress, isLast = false }: ExpenseRowProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const color = EXPENSE_CATEGORY_COLORS[expense.category as ExpenseCategory] ?? '#6B7280';
  const meta = EXPENSE_CATEGORIES.find((c) => c.key === expense.category);
  const soft = color + '22';

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-3 bg-surface-elevated dark:bg-surface-elevated-dark active:opacity-70 ${isLast ? '' : 'border-b border-border dark:border-border-dark'}`}
    >
      <View
        style={{ backgroundColor: soft }}
        className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
      >
        <Text className="text-lg">{meta?.emoji ?? '⋯'}</Text>
      </View>

      <View className="flex-1 min-w-0">
        <Text className="text-sm font-semibold text-content dark:text-content-dark" numberOfLines={1}>
          {t(`expenseCategories.${expense.category}` as any)}
        </Text>
        {expense.notes ? (
          <Text className="text-xs text-content-muted dark:text-content-muted-dark mt-0.5" numberOfLines={1}>
            {expense.notes}
          </Text>
        ) : (
          <Text className="text-xs text-content-muted dark:text-content-muted-dark mt-0.5">
            {formatDateTime(expense.date, dateLocale)}
          </Text>
        )}
        {expense.labels && expense.labels.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mt-1">
            {expense.labels.map((label) => (
              <LabelChip key={label.id} label={label} size="sm" />
            ))}
          </View>
        )}
      </View>

      <Text className="text-sm font-semibold flex-shrink-0" style={{ color }}>
        {fmt(expense.amount)}
      </Text>
    </Pressable>
  );
}
