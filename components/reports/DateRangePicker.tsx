import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useDateLocale } from '@/hooks/use-locale';
import type { ReportPeriod } from '@/types';

interface Period { key: ReportPeriod; labelKey: string; }

const PERIODS: Period[] = [
  { key: 'today', labelKey: 'datePicker.today' },
  { key: 'week', labelKey: 'datePicker.week' },
  { key: 'month', labelKey: 'datePicker.month' },
  { key: 'year', labelKey: 'datePicker.year' },
  { key: 'custom', labelKey: 'datePicker.custom' },
];

interface DateRangePickerProps {
  selected: ReportPeriod;
  customFrom: string;
  customTo: string;
  onSelectPeriod: (period: ReportPeriod) => void;
  onCustomFromChange: (date: string) => void;
  onCustomToChange: (date: string) => void;
}

type ActivePicker = 'from' | 'to' | null;

export function DateRangePicker({
  selected,
  customFrom,
  customTo,
  onSelectPeriod,
  onCustomFromChange,
  onCustomToChange,
}: DateRangePickerProps) {
  const { t } = useTranslation();
  const { color } = useAccentColor();
  const dateLocale = useDateLocale();
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const fromDate = customFrom ? new Date(`${customFrom}T00:00:00`) : new Date();
  const toDate = customTo ? new Date(`${customTo}T00:00:00`) : new Date();

  function formatDisplay(dateStr: string) {
    if (!dateStr) return t('datePicker.select');
    try {
      return format(new Date(`${dateStr}T00:00:00`), "d 'de' MMM, yyyy", { locale: dateLocale });
    } catch {
      return dateStr;
    }
  }

  function openPicker(type: ActivePicker) {
    setTempDate(type === 'from' ? fromDate : toDate);
    setActivePicker(type);
  }

  function handleConfirm() {
    if (activePicker === 'from') {
      onCustomFromChange(format(tempDate, 'yyyy-MM-dd'));
    } else {
      onCustomToChange(format(tempDate, 'yyyy-MM-dd'));
    }
    setActivePicker(null);
  }

  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-1 pb-1"
      >
        {PERIODS.map((period) => {
          const isSelected = selected === period.key;
          return (
            <Pressable
              key={period.key}
              onPress={() => onSelectPeriod(period.key)}
              style={isSelected ? { backgroundColor: color, borderColor: color } : undefined}
              className={`rounded-full px-4 py-2 border ${
                isSelected
                  ? 'border-transparent'
                  : 'bg-surface-elevated dark:bg-surface-elevated-dark border-border dark:border-border-dark'
              }`}
            >
              <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-content dark:text-content-dark'}`}>
                {t(period.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selected === 'custom' && (
        <View className="flex-row gap-3 mt-3">
          <View className="flex-1">
            <Text className="text-xs text-content-muted dark:text-content-muted-dark mb-1.5 font-medium">
              {t('datePicker.from')}
            </Text>
            <Pressable
              onPress={() => openPicker('from')}
              className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-3 py-3 flex-row items-center justify-between active:opacity-70"
            >
              <Text className={`text-sm ${customFrom ? 'text-content dark:text-content-dark font-medium' : 'text-content-subtle dark:text-content-subtle-dark'}`}>
                {formatDisplay(customFrom)}
              </Text>
              <IconSymbol name="calendar" size={15} color="#9A8A80" />
            </Pressable>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-content-muted dark:text-content-muted-dark mb-1.5 font-medium">
              {t('datePicker.to')}
            </Text>
            <Pressable
              onPress={() => openPicker('to')}
              className="bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-xl px-3 py-3 flex-row items-center justify-between active:opacity-70"
            >
              <Text className={`text-sm ${customTo ? 'text-content dark:text-content-dark font-medium' : 'text-content-subtle dark:text-content-subtle-dark'}`}>
                {formatDisplay(customTo)}
              </Text>
              <IconSymbol name="calendar" size={15} color="#9A8A80" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Modal picker */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <Pressable className="flex-1 bg-black/40" onPress={() => setActivePicker(null)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-8">
              {/* Handle */}
              <View className="items-center pt-3 pb-1">
                <View className="w-9 h-1 rounded-full bg-border-strong dark:bg-border-strong-dark" />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between px-5 py-3">
                <Pressable onPress={() => setActivePicker(null)} className="active:opacity-60">
                  <Text className="text-base text-content-muted dark:text-content-muted-dark">{t('common.cancel')}</Text>
                </Pressable>
                <Text className="text-base font-semibold text-content dark:text-content-dark">
                  {activePicker === 'from' ? t('datePicker.fromTitle') : t('datePicker.toTitle')}
                </Text>
                <Pressable onPress={handleConfirm} className="active:opacity-60">
                  <Text style={{ color }} className="text-base font-semibold">{t('common.done')}</Text>
                </Pressable>
              </View>

              <View style={{ alignItems: 'center' }}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  maximumDate={activePicker === 'from' ? toDate : undefined}
                  minimumDate={activePicker === 'to' ? fromDate : undefined}
                  onChange={(_, date) => { if (date) setTempDate(date); }}
                  style={{ height: 200, width: '100%' }}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
