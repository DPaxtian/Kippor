import { getPaletteTokens } from '@/constants/palette';
import { useUIStore } from '@/store/ui-store';

export function useAccentColor() {
  const colorScheme = useUIStore((s) => s.colorScheme);
  const accentPalette = useUIStore((s) => s.accentPalette);
  return getPaletteTokens(accentPalette, colorScheme);
}
