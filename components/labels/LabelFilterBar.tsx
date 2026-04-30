import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LabelChip } from './LabelChip';
import { useAccentColor } from '@/hooks/use-accent-color';
import type { Label } from '@/types';

interface LabelFilterBarProps {
  labels: Label[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  label?: string;
}

export function LabelFilterBar({ labels, selectedIds, onChange, label }: LabelFilterBarProps) {
  const { t } = useTranslation();
  const { color } = useAccentColor();
  const displayLabel = label ?? t('common.labels');

  if (labels.length === 0) return null;

  function toggle(id: number) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  }

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between px-1 mb-2">
        <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider">
          {displayLabel}
        </Text>
        {selectedIds.length > 0 && (
          <Pressable onPress={() => onChange([])} className="active:opacity-60">
            <Text style={{ color }} className="text-xs font-semibold">{t('common.clear')}</Text>
          </Pressable>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 2 }}>
        {labels.map((l) => (
          <LabelChip
            key={l.id}
            label={l}
            size="md"
            onPress={() => toggle(l.id)}
            selected={selectedIds.includes(l.id)}
            dimmed={selectedIds.length > 0 && !selectedIds.includes(l.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
