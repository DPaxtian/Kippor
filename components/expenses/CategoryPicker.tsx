import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_COLORS } from '@/constants/expense-categories';
import type { ExpenseCategory } from '@/types';

interface CategoryPickerProps {
  selected: ExpenseCategory;
  onChange: (category: ExpenseCategory) => void;
}

export function CategoryPicker({ selected, onChange }: CategoryPickerProps) {
  const { t } = useTranslation();

  return (
    <View className="px-4" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {EXPENSE_CATEGORIES.map((cat) => {
        const isSelected = selected === cat.key;
        const color = EXPENSE_CATEGORY_COLORS[cat.key];
        const soft = color + '22';

        return (
          <Pressable
            key={cat.key}
            onPress={() => onChange(cat.key)}
            className="items-center justify-center py-2.5 rounded-2xl active:opacity-70"
            style={{
              width: '23%',
              backgroundColor: isSelected ? color : soft,
              borderWidth: 1,
              borderColor: isSelected ? color : color + '44',
            }}
          >
            <Text className="text-xl mb-0.5">{cat.emoji}</Text>
            <Text
              className="text-xs font-medium text-center"
              style={{ color: isSelected ? '#fff' : color }}
              numberOfLines={1}
            >
              {t(`expenseCategories.${cat.key}` as any)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
