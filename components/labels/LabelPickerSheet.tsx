import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LabelChip } from './LabelChip';
import { useLabelsStore } from '@/store/labels-store';
import { useUIStore } from '@/store/ui-store';
import { useAccentColor } from '@/hooks/use-accent-color';
import { slugifyLabel } from '@/constants/label-colors';
import type { Label } from '@/types';

interface LabelPickerSheetProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onClose: () => void;
}

export function LabelPickerSheet({ selectedIds, onChange, onClose }: LabelPickerSheetProps) {
  const { t } = useTranslation();
  const { labels, createLabel } = useLabelsStore();
  const { colorScheme } = useUIStore();
  const { color } = useAccentColor();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#7A6E66' : '#9A8A80';

  const [query, setQuery] = useState('');
  const slug = slugifyLabel(query);
  const visible = labels.filter((l) =>
    l.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const exists = labels.some((l) => l.name === slug);
  const canCreate = slug.length > 0 && !exists;

  function toggle(id: number) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  }

  async function handleCreate() {
    if (!canCreate) return;
    const id = await createLabel({ name: slug, color: 'gray' });
    onChange([...selectedIds, id]);
    setQuery('');
  }

  return (
    <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-8">
      {/* Handle */}
      <View className="items-center pt-3 pb-1">
        <View className="w-9 h-1 rounded-full bg-border-strong dark:bg-border-strong-dark" />
      </View>
      <Text className="text-lg font-bold text-content dark:text-content-dark px-5 py-3">
        {t('labelPicker.title')}
      </Text>

      {/* Search */}
      <View className="flex-row items-center gap-2 mx-4 mb-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-3 py-2.5">
        <Text className="text-base font-bold text-content-muted dark:text-content-muted-dark">#</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('labelPicker.searchPlaceholder')}
          placeholderTextColor="#9A8A80"
          autoFocus
          style={{ flex: 1, fontSize: 16, padding: 0, color: isDark ? '#F4EDE7' : '#1F1815' }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} className="active:opacity-60">
            <IconSymbol name="xmark.circle.fill" size={16} color={iconColor} />
          </Pressable>
        )}
      </View>

      <ScrollView style={{ maxHeight: 340 }} keyboardShouldPersistTaps="handled">
        {/* Crear nueva */}
        {canCreate && (
          <Pressable
            onPress={handleCreate}
            className="flex-row items-center gap-3 mx-4 mb-2 px-3 py-3 rounded-xl active:opacity-70"
            style={{ backgroundColor: color + '18' }}
          >
            <IconSymbol name="plus" size={18} color={color} />
            <View>
              <Text style={{ color }} className="text-sm font-semibold">{t('labelPicker.create')}</Text>
              <Text style={{ color, opacity: 0.7 }} className="text-xs">#{slug}</Text>
            </View>
          </Pressable>
        )}

        {visible.length === 0 && !canCreate && (
          <View className="py-10 items-center">
            <Text className="text-sm text-content-muted dark:text-content-muted-dark">{t('labelPicker.empty')}</Text>
          </View>
        )}

        {visible.map((label) => {
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
      </Modal>
    </View>
  );
}
