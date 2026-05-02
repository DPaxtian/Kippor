import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LabelFilterBar } from '@/components/labels/LabelFilterBar';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import { ModalHandle } from '@/components/ui/ModalHandle';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useUIStore } from '@/store/ui-store';
import { useLabelsStore } from '@/store/labels-store';
import type { PaymentMethod, ReportPeriod } from '@/types';

export type PaymentStatusFilter = 'all' | 'paid' | 'unpaid';

export interface HistoryFilters {
  period: ReportPeriod;
  customFrom: string;
  customTo: string;
  paymentStatus: PaymentStatusFilter;
  paymentMethods: PaymentMethod[];
  labelIds: number[];
}

interface HistoryFilterModalProps {
  visible: boolean;
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
  onClose: () => void;
}

const PAYMENT_STATUSES: { key: PaymentStatusFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'history.filterAll' },
  { key: 'paid', labelKey: 'history.filterPaid' },
  { key: 'unpaid', labelKey: 'history.filterUnpaid' },
];

const PAYMENT_METHODS: { key: PaymentMethod; labelKey: string }[] = [
  { key: 'cash', labelKey: 'paymentMethod.cash' },
  { key: 'card', labelKey: 'paymentMethod.card' },
  { key: 'transfer', labelKey: 'paymentMethod.transfer' },
];

export function HistoryFilterModal({ visible, filters, onChange, onClose }: HistoryFilterModalProps) {
  const { t } = useTranslation();
  const { color } = useAccentColor();
  const { colorScheme } = useUIStore();
  const { labels } = useLabelsStore();
  const isDark = colorScheme === 'dark';
  const chipBase = `rounded-full px-3.5 py-2 border`;
  const chipInactive = `bg-surface dark:bg-surface-dark border-border dark:border-border-dark`;

  function set(partial: Partial<HistoryFilters>) {
    onChange({ ...filters, ...partial });
  }

  function toggleMethod(key: PaymentMethod) {
    const current = filters.paymentMethods;
    const next = current.includes(key) ? current.filter((m) => m !== key) : [...current, key];
    set({ paymentMethods: next });
  }

  const activeCount =
    (filters.period !== 'month' ? 1 : 0) +
    (filters.paymentStatus !== 'all' ? 1 : 0) +
    (filters.paymentMethods.length > 0 ? 1 : 0) +
    (filters.labelIds.length > 0 ? 1 : 0);

  function handleReset() {
    onChange({
      period: 'month',
      customFrom: '',
      customTo: '',
      paymentStatus: 'all',
      paymentMethods: [],
      labelIds: [],
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable className="flex-1 bg-black/40" onPress={onClose}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl">
              <ModalHandle onClose={onClose} />

              {/* Header */}
              <View className="flex-row items-center justify-between px-5 pb-3">
                <Text className="text-lg font-bold text-content dark:text-content-dark">
                  {t('history.filters')}
                </Text>
                {activeCount > 0 && (
                  <Pressable onPress={handleReset} className="active:opacity-60">
                    <Text style={{ color }} className="text-sm font-semibold">
                      {t('common.clear')}
                    </Text>
                  </Pressable>
                )}
              </View>

              <ScrollView
                style={{ maxHeight: 520 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Período */}
                <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-3">
                  {t('history.filterPeriod')}
                </Text>
                <DateRangePicker
                  selected={filters.period}
                  customFrom={filters.customFrom}
                  customTo={filters.customTo}
                  onSelectPeriod={(p) => set({ period: p, ...(p !== 'custom' ? { customFrom: '', customTo: '' } : {}) })}
                  onCustomFromChange={(v) => set({ customFrom: v })}
                  onCustomToChange={(v) => set({ customTo: v })}
                />

                {/* Estado de pago */}
                <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-3 mt-2">
                  {t('history.filterPaymentStatus')}
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {PAYMENT_STATUSES.map(({ key, labelKey }) => {
                    const active = filters.paymentStatus === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => set({ paymentStatus: key })}
                        style={active ? { backgroundColor: color, borderColor: color } : undefined}
                        className={`${chipBase} ${active ? 'border-transparent' : chipInactive}`}
                      >
                        <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-content dark:text-content-dark'}`}>
                          {t(labelKey as any)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Método de pago */}
                <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-3 mt-5">
                  {t('orderForm.paymentMethod')}
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {PAYMENT_METHODS.map(({ key, labelKey }) => {
                    const active = filters.paymentMethods.includes(key);
                    return (
                      <Pressable
                        key={key}
                        onPress={() => toggleMethod(key)}
                        style={active ? { backgroundColor: color, borderColor: color } : undefined}
                        className={`${chipBase} ${active ? 'border-transparent' : chipInactive}`}
                      >
                        <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-content dark:text-content-dark'}`}>
                          {t(labelKey as any)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Etiquetas */}
                {labels.length > 0 && (
                  <View className="mt-5">
                    <LabelFilterBar
                      labels={labels}
                      selectedIds={filters.labelIds}
                      onChange={(ids) => set({ labelIds: ids })}
                    />
                  </View>
                )}
              </ScrollView>

              {/* Botón cerrar */}
              <View className="px-5 pb-8 pt-2 border-t border-border dark:border-border-dark">
                <Pressable
                  onPress={onClose}
                  style={{ backgroundColor: color }}
                  className="rounded-xl py-3.5 items-center active:opacity-80"
                >
                  <Text className="text-white font-semibold text-base">{t('common.done')}</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
