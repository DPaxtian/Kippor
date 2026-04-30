import { Pressable, Text, View } from 'react-native';
import { useUIStore } from '@/store/ui-store';
import { resolveLabelColor } from '@/constants/label-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Label } from '@/types';

interface LabelChipProps {
  label: Label;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  onPress?: () => void;
  dimmed?: boolean;
  selected?: boolean;
}

export function LabelChip({ label, size = 'md', onRemove, onPress, dimmed, selected }: LabelChipProps) {
  const isDark = useUIStore((s) => s.colorScheme === 'dark');
  const { bg, fg } = resolveLabelColor(label.color, isDark);

  const px = size === 'sm' ? 7 : 9;
  const py = size === 'sm' ? 2 : 4;
  const fs = size === 'sm' ? 11 : 12;

  const inner = (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: px,
        paddingVertical: py,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        opacity: dimmed ? 0.35 : 1,
        borderWidth: selected ? 1.5 : 0,
        borderColor: selected ? fg : 'transparent',
      }}
    >
      {selected && <IconSymbol name="checkmark" size={fs - 1} color={fg} />}
      {!selected && <Text style={{ color: fg, fontSize: fs, fontWeight: '700', opacity: 0.55 }}>#</Text>}
      <Text style={{ color: fg, fontSize: fs, fontWeight: selected ? '700' : '600' }}>{label.name}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={6} className="active:opacity-60">
          <IconSymbol name="xmark" size={10} color={fg} />
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {inner}
      </Pressable>
    );
  }

  return inner;
}
