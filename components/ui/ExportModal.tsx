import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccentColor } from '@/hooks/use-accent-color';
import { useUIStore } from '@/store/ui-store';
import { exportCSV, exportPDF } from '@/utils/export';
import { getDateRange } from '@/utils/dates';
import type { ReportPeriod } from '@/types';

type ExportFormat = 'csv' | 'pdf';
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
}

export function ExportModal({ visible, onClose }: ExportModalProps) {
  const { t } = useTranslation();
  const { color, soft } = useAccentColor();
  const { colorScheme, accentPalette, businessName, currency, reportDateRange } = useUIStore();

  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('month');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isLoading, setIsLoading] = useState(false);

  const isDark = colorScheme === 'dark';

  async function handleExport() {
    setIsLoading(true);
    try {
      const range = getDateRange(selectedPeriod);
      const opts = {
        from: range.from,
        to: range.to,
        businessName,
        currency,
        accentColor: color,
        accentSoft: soft,
        isDark,
      };

      if (selectedFormat === 'csv') {
        await exportCSV(opts);
      } else {
        await exportPDF(opts);
      }
      onClose();
    } catch (e) {
      Alert.alert(t('common.error'), t('export.errorMessage'));
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-10">

            {/* Handle */}
            <View className="items-center pt-3 pb-1">
              <View className="w-9 h-1 rounded-full bg-border-strong dark:bg-border-strong-dark" />
            </View>

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

                {/* Format selector */}
                <View>
                  <Text className="text-xs font-semibold uppercase tracking-wider text-content-muted dark:text-content-muted-dark mb-2 px-1">
                    {t('export.formatSection')}
                  </Text>
                  <View className="flex-row gap-3">
                    <FormatCard
                      format="pdf"
                      selected={selectedFormat === 'pdf'}
                      onPress={() => setSelectedFormat('pdf')}
                      color={color} soft={soft} isDark={isDark} t={t}
                    />
                    <FormatCard
                      format="csv"
                      selected={selectedFormat === 'csv'}
                      onPress={() => setSelectedFormat('csv')}
                      color={color} soft={soft} isDark={isDark} t={t}
                    />
                  </View>
                </View>

                {/* Period selector */}
                <View>
                  <Text className="text-xs font-semibold uppercase tracking-wider text-content-muted dark:text-content-muted-dark mb-2 px-1">
                    {t('export.periodSection')}
                  </Text>
                  <View className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl overflow-hidden">
                    {PERIOD_OPTIONS.map((opt, i) => {
                      const isSelected = selectedPeriod === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => setSelectedPeriod(opt.key)}
                          className={`flex-row items-center px-4 py-3.5 active:opacity-60 ${
                            i < PERIOD_OPTIONS.length - 1 ? 'border-b border-border dark:border-border-dark' : ''
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
                  </View>
                </View>

                {/* Export button */}
                <Pressable
                  onPress={handleExport}
                  disabled={isLoading}
                  style={{ backgroundColor: color, opacity: isLoading ? 0.7 : 1 }}
                  className="rounded-xl py-4 items-center active:opacity-80 flex-row justify-center gap-2"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <IconSymbol
                        name={selectedFormat === 'pdf' ? 'doc.fill' : 'tablecells.fill'}
                        size={16}
                        color="#fff"
                      />
                      <Text className="text-white font-semibold text-base">
                        {t('export.button', { format: selectedFormat.toUpperCase() })}
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

// ─── FormatCard ───────────────────────────────────────────────────────────────

function FormatCard({
  format, selected, onPress, color, soft, isDark, t,
}: {
  format: ExportFormat; selected: boolean; onPress: () => void;
  color: string; soft: string; isDark: boolean; t: (key: string) => string;
}) {
  const isPDF = format === 'pdf';

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 active:opacity-70"
      style={{
        backgroundColor: selected ? soft : isDark ? '#211C19' : '#FFFFFF',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? color : isDark ? '#332A26' : '#E8E0D8',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        gap: 8,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: selected ? color : isDark ? '#2A231F' : '#F2EDE8',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconSymbol
          name={isPDF ? 'doc.richtext.fill' : 'tablecells.fill'}
          size={22}
          color={selected ? '#fff' : isDark ? '#7A6E66' : '#9A8A80'}
        />
      </View>
      <Text
        style={{
          fontSize: 15,
          fontWeight: '700',
          color: selected ? color : isDark ? '#F4EDE7' : '#1F1815',
        }}
      >
        {format.toUpperCase()}
      </Text>
      <Text
        style={{
          fontSize: 11,
          textAlign: 'center',
          color: isDark ? '#B8ADA5' : '#6B5D54',
          lineHeight: 15,
        }}
      >
        {isPDF ? t('export.pdfDescription') : t('export.csvDescription')}
      </Text>
    </Pressable>
  );
}
