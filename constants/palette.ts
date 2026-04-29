import type { AccentPalette, AppColorScheme } from '@/store/ui-store';

export interface AppTokens {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  primarySoftDark: string;
}

const PALETTES: Record<AccentPalette, AppTokens> = {
  terracota: {
    primary: '#C45A3F',
    primaryDark: '#E07A5F',
    primarySoft: '#FFE8DF',
    primarySoftDark: '#3A1F18',
  },
  rosa: {
    primary: '#C8536F',
    primaryDark: '#E07396',
    primarySoft: '#FFE3EA',
    primarySoftDark: '#3A1A24',
  },
  miel: {
    primary: '#B07A2A',
    primaryDark: '#D9A04A',
    primarySoft: '#FBEFD4',
    primarySoftDark: '#2E2310',
  },
  oliva: {
    primary: '#5F7A3D',
    primaryDark: '#8AA85F',
    primarySoft: '#EAF1DA',
    primarySoftDark: '#1E2611',
  },
  pizarra: {
    primary: '#4A6FA5',
    primaryDark: '#7B9EC9',
    primarySoft: '#DDE8F5',
    primarySoftDark: '#162033',
  },
};

export function getPaletteTokens(
  palette: AccentPalette,
  scheme: AppColorScheme
): { color: string; soft: string } {
  const p = PALETTES[palette];
  return {
    color: scheme === 'dark' ? p.primaryDark : p.primary,
    soft: scheme === 'dark' ? p.primarySoftDark : p.primarySoft,
  };
}

export { PALETTES };
