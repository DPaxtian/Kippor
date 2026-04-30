import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryPicker } from '@/components/expenses/CategoryPicker';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { ModalHandle } from '@/components/ui/ModalHandle';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useCurrency } from '@/hooks/use-currency';
import { useDateFormat, useDateLocale } from '@/hooks/use-locale';
import { useExpensesStore } from '@/store/expenses-store';
import { useUIStore } from '@/store/ui-store';
import type { ExpenseCategory } from '@/types';
import { formatDate } from '@/utils/format';

export default function EditExpenseScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { color } = useAccentColor();
  const { symbol } = useCurrency();
  const { colorScheme } = useUIStore();
  const dateLocale = useDateLocale();
  const dateFormat = useDateFormat();
  const navigation = useNavigation();
  const { selectedExpense, fetchExpenseById, updateExpense } = useExpensesStore();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('supplies');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [ready, setReady] = useState(false);

  const isDark = colorScheme === 'dark';
  const inputClass = `text-base text-content dark:text-content-dark bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3`;

  useEffect(() => {
    async function load() {
      await fetchExpenseById(Number(id));
    }
    load();
  }, [id]); // eslint-disable-line

  useEffect(() => {
    if (selectedExpense && selectedExpense.id === Number(id)) {
      setAmount(String(selectedExpense.amount));
      setCategory(selectedExpense.category);
      setSelectedDate(new Date(selectedExpense.date));
      setNotes(selectedExpense.notes ?? '');
      setReady(true);
    }
  }, [selectedExpense, id]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => router.back()} className="px-1 active:opacity-60">
          <Text style={{ color }} className="text-base font-medium">{t('common.cancel')}</Text>
        </Pressable>
      ),
    });
  }, [navigation, color]);

  async function handleSave() {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('expenseForm.errorAmountRequired'));
      return;
    }
    setSaving(true);
    try {
      await updateExpense(Number(id), {
        amount: parsedAmount,
        category,
        date: selectedDate.toISOString(),
        notes: notes.trim() || null,
      });
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('common.saving'));
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-surface-dark" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={100}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Monto */}
          <View className="mx-4 mt-6 mb-4">
            <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wide mb-2">
              {t('expenseForm.amount')}
            </Text>
            <View className="flex-row items-center bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 gap-2">
              <Text className="text-base text-content-muted dark:text-content-muted-dark">{symbol}</Text>
              <AppTextInput
                className="flex-1 text-base text-content dark:text-content-dark"
                placeholder="0.00"
                placeholderTextColor={isDark ? '#7A6E66' : '#9A8A80'}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Categoría */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wide mb-2 mx-4">
              {t('expenseForm.category')}
            </Text>
            <CategoryPicker selected={category} onChange={setCategory} />
          </View>

          {/* Fecha */}
          <View className="mx-4 mb-4">
            <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wide mb-2">
              {t('expenseForm.date')}
            </Text>
            <Pressable
              onPress={() => { setTempDate(selectedDate); setShowDatePicker(true); }}
              className="flex-row items-center justify-between bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 active:opacity-70"
            >
              <Text className="text-base text-content dark:text-content-dark">
                {formatDate(selectedDate.toISOString(), dateLocale, dateFormat)}
              </Text>
            </Pressable>
          </View>

          {/* Notas */}
          <View className="mx-4 mb-6">
            <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wide mb-2">
              {t('expenseForm.notesLabel')}
            </Text>
            <AppTextInput
              className={`${inputClass} min-h-[80px]`}
              placeholder={t('expenseForm.notesPlaceholder')}
              placeholderTextColor={isDark ? '#7A6E66' : '#9A8A80'}
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </ScrollView>

        {/* Footer: guardar */}
        <View className="mx-4 mb-2">
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{ backgroundColor: color }}
            className="py-4 rounded-2xl items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">
              {saving ? t('common.saving') : t('expenseForm.saveChanges')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Date picker modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowDatePicker(false)}>
          <Pressable>
            <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-6">
              <ModalHandle onClose={() => setShowDatePicker(false)} />
              <Text className="text-base font-semibold text-content dark:text-content-dark text-center mb-2">
                {t('expenseForm.dateModal')}
              </Text>
              <View style={{ alignItems: 'center' }}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  locale={dateLocale.code ?? 'es'}
                  onChange={(_, d) => { if (d) setTempDate(d); }}
                  style={{ height: 200, width: '100%' }}
                />
              </View>
              <Pressable
                onPress={() => { setSelectedDate(tempDate); setShowDatePicker(false); }}
                style={{ backgroundColor: color }}
                className="mx-4 py-3 rounded-xl items-center active:opacity-80"
              >
                <Text className="text-white font-semibold">{t('datePicker.select')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
