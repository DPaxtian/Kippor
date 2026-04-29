import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { ModalHandle } from '@/components/ui/ModalHandle';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LabelChip } from './LabelChip';
import { useLabelsStore } from '@/store/labels-store';
import { useUIStore } from '@/store/ui-store';
import { useAccentColor } from '@/hooks/use-accent-color';

interface LabelPickerSheetProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onClose: () => void;
}

export function LabelPickerSheet({ selectedIds, onChange, onClose }: LabelPickerSheetProps) {
  const { t } = useTranslation();
  const { labels } = useLabelsStore();
  const { colorScheme } = useUIStore();
  const { color } = useAccentColor();
  const isDark = colorScheme === 'dark';

  function toggle(id: number) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  }

  return (
    <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-8">
      <ModalHandle onClose={onClose} />
      <Text className="text-lg font-bold text-content dark:text-content-dark px-5 py-3">
        {t('labelPicker.title')}
      </Text>

      <ScrollView style={{ maxHeight: 340 }}>
        {labels.length === 0 && (
          <View className="py-10 items-center px-8 gap-3">
            <IconSymbol name="tag.slash" size={32} color={isDark ? '#7A6E66' : '#9A8A80'} />
            <Text className="text-sm text-content-muted dark:text-content-muted-dark text-center">
              {t('labelPicker.empty')}
            </Text>
            <Text className="text-xs text-content-muted dark:text-content-muted-dark text-center opacity-70">
              {t('labelPicker.emptyHint')}
            </Text>
          </View>
        )}

        {labels.map((label) => {
          const active = selectedIds.includes(label.id);
          return (
            <Pressable
              key={label.id}
              onPress={() => toggle(label.id)}
              className="flex-row items-center gap-3 px-5 py-3 active:opacity-60"
            >
              <LabelChip label={label} size="md" />
              <View style={{ flex: 1 }} />
              <View
                style={{
                  width: 22, height: 22, borderRadius: 11,
                  borderWidth: 1.5,
                  borderColor: active ? color : (isDark ? '#7A6E66' : '#C8BDB8'),
                  backgroundColor: active ? color : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {active && <IconSymbol name="checkmark" size={12} color="#FFFFFF" />}
              </View>
            </Pressable>
          );
        })}
        <View className="h-2" />
      </ScrollView>

      {/* Footer */}
      <View className="px-4 pt-3 border-t border-border dark:border-border-dark">
        <Pressable
          onPress={onClose}
          style={{ backgroundColor: color }}
          className="rounded-xl py-3.5 items-center active:opacity-80"
        >
          <Text className="text-white font-semibold text-base">{t('common.done')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface LabelPickerProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function LabelPicker({ selectedIds, onChange }: LabelPickerProps) {
  const { t } = useTranslation();
  const { labels } = useLabelsStore();
  const { color } = useAccentColor();
  const isDark = useUIStore((s) => s.colorScheme === 'dark');
  const iconColor = isDark ? '#7A6E66' : '#9A8A80';
  const [open, setOpen] = useState(false);

  const selected = labels.filter((l) => selectedIds.includes(l.id));

  return (
    <View>
      <View className="flex-row flex-wrap gap-2 items-center">
        {selected.map((label) => (
          <LabelChip
            key={label.id}
            label={label}
            size="md"
            onRemove={() => onChange(selectedIds.filter((id) => id !== label.id))}
          />
        ))}
        <Pressable
          onPress={() => setOpen(true)}
          className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 border border-dashed active:opacity-60"
          style={{ borderColor: iconColor }}
        >
          <IconSymbol name="plus" size={12} color={iconColor} />
          <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark">
            {selected.length === 0 ? t('labelPicker.add') : t('labelPicker.more')}
          </Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)}>
            <View className="flex-1" />
            <Pressable onPress={(e) => e.stopPropagation()}>
              <LabelPickerSheet
                selectedIds={selectedIds}
                onChange={onChange}
                onClose={() => setOpen(false)}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
