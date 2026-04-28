import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LabelChip } from './LabelChip';
import { useLabelsStore } from '@/store/labels-store';
import { useUIStore } from '@/store/ui-store';
import { useAccentColor } from '@/hooks/use-accent-color';
import { LABEL_COLOR_KEYS, resolveLabelColor, slugifyLabel } from '@/constants/label-colors';
import type { Label } from '@/types';

interface LabelFormModalProps {
  initial: Label | null;
  onSave: (data: { name: string; color: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function LabelFormModal({ initial, onSave, onDelete, onClose }: LabelFormModalProps) {
  const isDark = useUIStore((s) => s.colorScheme === 'dark');
  const { color } = useAccentColor();
  const iconColor = isDark ? '#7A6E66' : '#9A8A80';

  const [name, setName] = useState(initial?.name ?? '');
  const [selectedColor, setSelectedColor] = useState(initial?.color ?? 'red');

  const slug = slugifyLabel(name);
  const valid = slug.length > 0;

  const previewLabel: Label = { id: 0, name: slug || 'etiqueta', color: selectedColor, created_at: '' };

  function handleDelete() {
    Alert.alert(
      '¿Eliminar etiqueta?',
      'Se quitará de todos los pedidos donde esté asignada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: onDelete },
      ]
    );
  }

  return (
    <View className="bg-surface-elevated dark:bg-surface-elevated-dark rounded-t-3xl pb-10">
      {/* Handle */}
      <View className="items-center pt-3 pb-1">
        <View className="w-9 h-1 rounded-full bg-border-strong dark:bg-border-strong-dark" />
      </View>
      <Text className="text-lg font-bold text-content dark:text-content-dark px-5 pt-3 pb-1">
        {initial ? 'Editar etiqueta' : 'Nueva etiqueta'}
      </Text>

      {/* Live preview */}
      <View className="items-center py-4">
        <LabelChip label={previewLabel} size="md" />
      </View>

      {/* Name input */}
      <View className="flex-row items-center gap-2 mx-4 mb-4 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-3 py-2.5">
        <Text className="text-lg font-bold text-content-muted dark:text-content-muted-dark">#</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="nombre-de-etiqueta"
          placeholderTextColor="#9A8A80"
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          style={{ flex: 1, fontSize: 16, padding: 0, color: isDark ? '#F4EDE7' : '#1F1815' }}
        />
      </View>
      {name.length > 0 && slug !== name.toLowerCase().trim() && (
        <Text className="text-xs text-content-muted dark:text-content-muted-dark mx-5 -mt-2 mb-3">
          Se guardará como <Text className="font-semibold text-content dark:text-content-dark">#{slug}</Text>
        </Text>
      )}

      {/* Color picker */}
      <View className="px-4 mb-5">
        <Text className="text-xs font-semibold text-content-muted dark:text-content-muted-dark uppercase tracking-wider mb-3">Color</Text>
        <View className="flex-row flex-wrap gap-3">
          {LABEL_COLOR_KEYS.map((key) => {
            const { bg, fg } = resolveLabelColor(key, isDark);
            const active = key === selectedColor;
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedColor(key)}
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: bg,
                  borderWidth: active ? 2 : 0,
                  borderColor: active ? fg : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}
                className="active:opacity-70"
              >
                {active && <IconSymbol name="checkmark" size={16} color={fg} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-3 px-4">
        {onDelete && (
          <Pressable
            onPress={handleDelete}
            className="w-11 h-11 rounded-xl border border-error dark:border-error-dark items-center justify-center active:opacity-70"
          >
            <IconSymbol name="trash.fill" size={18} color={isDark ? '#E97864' : '#C24A38'} />
          </Pressable>
        )}
        <Pressable
          onPress={onClose}
          className="flex-1 h-11 rounded-xl border border-border dark:border-border-dark items-center justify-center active:opacity-70"
        >
          <Text className="text-base font-semibold text-content dark:text-content-dark">Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={() => valid && onSave({ name: slug, color: selectedColor })}
          disabled={!valid}
          style={{ backgroundColor: valid ? color : (isDark ? '#332A26' : '#E8E0D8') }}
          className="flex-1 h-11 rounded-xl items-center justify-center active:opacity-80"
        >
          <Text className={`text-base font-semibold ${valid ? 'text-white' : 'text-content-muted dark:text-content-muted-dark'}`}>
            Guardar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function LabelEditor({ triggerNew = 0 }: { triggerNew?: number }) {
  const { labels, createLabel, updateLabel, deleteLabel } = useLabelsStore();
  const isDark = useUIStore((s) => s.colorScheme === 'dark');
  const { color, soft } = useAccentColor();
  const iconColor = isDark ? '#7A6E66' : '#9A8A80';

  const [editing, setEditing] = useState<Label | 'new' | null>(null);

  useEffect(() => {
    if (triggerNew > 0) setEditing('new');
  }, [triggerNew]);

  return (
    <View className="flex-1">
      {/* Explanation banner */}
      <View style={{ backgroundColor: soft }} className="mx-4 mt-4 mb-3 rounded-2xl p-3 flex-row gap-3 items-start">
        <View style={{ backgroundColor: color }} className="w-7 h-7 rounded-full items-center justify-center flex-shrink-0">
          <Text className="text-white text-sm font-bold">#</Text>
        </View>
        <Text style={{ color }} className="flex-1 text-sm leading-5">
          Crea etiquetas como <Text className="font-bold">#urgente</Text> o <Text className="font-bold">#cumpleaños</Text> y asígnalas a tus pedidos. Filtra por ellas en Historial y Reportes.
        </Text>
      </View>

      {labels.length === 0 ? (
        <View className="mx-4 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl py-10 items-center">
          <Text className="text-3xl opacity-40 mb-2">#</Text>
          <Text className="text-base font-semibold text-content dark:text-content-dark mb-1">Sin etiquetas</Text>
          <Text className="text-sm text-content-muted dark:text-content-muted-dark">Toca «Nueva» para crear la primera</Text>
        </View>
      ) : (
        <View className="mx-4 bg-surface-elevated dark:bg-surface-elevated-dark border border-border dark:border-border-dark rounded-2xl overflow-hidden">
          {labels.map((label, index) => (
            <Pressable
              key={label.id}
              onPress={() => setEditing(label)}
              className={`flex-row items-center gap-3 px-4 py-3.5 active:opacity-60 ${index < labels.length - 1 ? 'border-b border-border dark:border-border-dark' : ''}`}
            >
              <LabelChip label={label} size="md" />
              <View style={{ flex: 1 }} />
              <IconSymbol name="chevron.right" size={14} color={iconColor} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Form modal */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <Pressable className="flex-1 bg-black/40" onPress={() => setEditing(null)}>
          <View className="flex-1" />
          <Pressable onPress={(e) => e.stopPropagation()}>
            {editing !== null && (
              <LabelFormModal
                initial={editing === 'new' ? null : editing}
                onClose={() => setEditing(null)}
                onSave={async (data) => {
                  if (editing === 'new') await createLabel(data);
                  else await updateLabel(editing.id, data);
                  setEditing(null);
                }}
                onDelete={editing !== 'new' ? async () => {
                  await deleteLabel(editing.id);
                  setEditing(null);
                } : undefined}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Botón para abrir la pantalla de etiquetas — usado en Settings
interface LabelSettingsRowProps {
  onPress: () => void;
  iconColor: string;
}

export function LabelSettingsRow({ onPress, iconColor }: LabelSettingsRowProps) {
  const { labels } = useLabelsStore();
  return { onPress, iconColor, count: labels.length };
}
