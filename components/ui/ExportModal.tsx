import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useUIStore } from '@/store/ui-store';
import { exportCSV, exportPDF } from '@/utils/export';
import { getDateRange } from '@/utils/dates';
import { ModalHandle } from '@/components/ui/ModalHandle';
import { LabelChip } from '@/components/labels/LabelChip';
import { useLabelsStore } from '@/store/labels-store';
import type { ReportPeriod } from '@/types';

type PeriodOption = { key: ReportPeriod; labelKey: string; sublabelKey: string };

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: 'today', labelKey: 'datePicker.today', sublabelKey: 'export.periodToday' },
  { key: 'week', labelKey: 'datePicker.week', sublabelKey: 'export.periodWeek' },
  { key: 'month', labelKey: 'datePicker.month', sublabelKey: 'export.periodMonth' },
  { key: 'year', labelKey: 'datePicker.year', sublabelKey: 'export.periodYear' },
];

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  initialPeriod?: ReportPeriod;
  initialDateRange?: { from: string; to: string };
  initialLabelIds?: number[];
}

export function ExportModal({ visible, onClose, initialPeriod, initialDateRange, initialLabelIds }: ExportModalProps) {
  const { t } = useTranslation();
  const { color, soft } = useAccentColor();
  const { colorScheme, businessName, currency } = useUIStore();
  const { labels, fetchLabels } = useLabelsStore();

  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(initialPeriod ?? 'month');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(initialLabelIds ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const exportingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setSelectedPeriod(initialPeriod ?? 'month');
      setSelectedLabelIds(initialLabelIds ?? []);
      fetchLabels();
    }
  }, [visible, initialPeriod, initialLabelIds]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && exportingRef.current) {
        exportingRef.current = false;
        setIsLoading(false);
      }
    });
    return () => sub.remove();
  }, []);

  const isDark = colorScheme === 'dark';

  function buildOpts(from: string, to: string) {
    const labelNames = labels
      .filter(l => selectedLabelIds.includes(l.id))
      .map(l => l.name);
    return {
      from,
      to,
      businessName,
      currency,
      accentColor: color,
      accentSoft: soft,
      isDark,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      labelNames: labelNames.length > 0 ? labelNames : undefined,
    };
  }

  async function handleExport(format: 'pdf' | 'csv') {
    setIsLoading(true);
    exportingRef.current = true;
    try {
      const range = selectedPeriod === 'custom' && initialDateRange
        ? initialDateRange
        : getDateRange(selectedPeriod);
      const opts = buildOpts(range.from, range.to);

      if (format === 'pdf') await exportPDF(opts);
      else await exportCSV(opts);
      onClose();
    } catch (e) {
      Alert.alert(t('common.error'), t('export.errorMessage'));
      console.error(e);
    } finally {
      exportingRef.current = false;
      setIsLoading(false);
    }
  }

  const showCustomOption = initialPeriod === 'custom' && initialDateRange;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-10">

            <ModalHandle onClose={onClose} />

            <ScrollView bounces={false}>
              <View className="px-5 pt-2 pb-6 gap-5">

                {/* Title */}
                <View>
                  <Text className="text-xl font-bold text-content dark:text-content-dark">
                    {t('export.title')}
                  </Text>
                  <Text className="text-sm text-content-muted dark:text-content-muted-dark mt-0.5">
                    {t('export.subtitle')}
                  </Text>
                </View>

                {/* Label selector */}
                {labels.length > 0 && (
                  <View>
                    <View className="flex-row items-center justify-between px-1 mb-2">
                      <Text className="text-xs font-semibold uppercase tracking-wider text-content-muted dark:text-content-muted-dark">
                        {t('export.labelSection')}
                      </Text>
                      {selectedLabelIds.length > 0 && (
                        <Pressable onPress={() => setSelectedLabelIds([])} className="active:opacity-60">
                          <Text style={{ color }} className="text-xs font-semibold">{t('common.clear')}</Text>
                        </Pressable>
                      )}
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 2 }}>
                      {labels.map((label) => (
                        <LabelChip
                          key={label.id}
                          label={label}
                          size="md"
                          onPress={() => {
                            const isSelected = selectedLabelIds.includes(label.id);
                            setSelectedLabelIds(isSelected
                              ? selectedLabelIds.filter(id => id !== label.id)
                              : [...selectedLabelIds, label.id]
                            );
                          }}
                          selected={selectedLabelIds.includes(label.id)}
                          dimmed={selectedLabelIds.length > 0 && !selectedLabelIds.includes(label.id)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Period selector */}
                <View>
                  <Text className="text-xs font-semibold uppercase tracking-wider text-content-muted dark:text-content-muted-dark mb-2 px-1">
                    {t('export.periodSection')}
                  </Text>
                  <View className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl overflow-hidden">
                    {PERIOD_OPTIONS.map((opt, i) => {
                      const isSelected = selectedPeriod === opt.key;
                      const isLast = i === PERIOD_OPTIONS.length - 1 && !showCustomOption;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => setSelectedPeriod(opt.key)}
                          className={`flex-row items-center px-4 py-3.5 active:opacity-60 ${
                            !isLast ? 'border-b border-border dark:border-border-dark' : ''
                          }`}
                        >
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              borderWidth: isSelected ? 6 : 2,
                              borderColor: isSelected ? color : isDark ? '#453B36' : '#D6CBC0',
                              marginRight: 12,
                            }}
                          />
                          <View className="flex-1">
                            <Text
                              className="text-base text-content dark:text-content-dark"
                              style={isSelected ? { fontWeight: '600', color } : undefined}
                            >
                              {t(opt.labelKey)}
                            </Text>
                            <Text className="text-xs text-content-muted dark:text-content-muted-dark">
                              {t(opt.sublabelKey)}
                            </Text>
                          </View>
                          {isSelected && (
                            <IconSymbol name="checkmark" size={14} color={color} />
                          )}
                        </Pressable>
                      );
                    })}
                    {showCustomOption && (
                      <Pressable
                        onPress={() => setSelectedPeriod('custom')}
                        className="flex-row items-center px-4 py-3.5 active:opacity-60"
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: selectedPeriod === 'custom' ? 6 : 2,
                            borderColor: selectedPeriod === 'custom' ? color : isDark ? '#453B36' : '#D6CBC0',
                            marginRight: 12,
                          }}
                        />
                        <View className="flex-1">
                          <Text
                            className="text-base text-content dark:text-content-dark"
                            style={selectedPeriod === 'custom' ? { fontWeight: '600', color } : undefined}
                          >
                            {t('reports.periodCustom')}
                          </Text>
                          <Text className="text-xs text-content-muted dark:text-content-muted-dark">
                            {t('export.periodCustomSub')}
                          </Text>
                        </View>
                        {selectedPeriod === 'custom' && (
                          <IconSymbol name="checkmark" size={14} color={color} />
                        )}
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Export button */}
                <Pressable
                  onPress={() => handleExport('pdf')}
                  disabled={isLoading}
                  style={{ backgroundColor: color, opacity: isLoading ? 0.7 : 1 }}
                  className="rounded-xl py-4 items-center active:opacity-80 flex-row justify-center gap-2"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <IconSymbol name="doc.fill" size={16} color="#fff" />
                      <Text className="text-white font-semibold text-base">
                        {t('export.button', { format: 'PDF' })}
                      </Text>
                    </>
                  )}
                </Pressable>

              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
