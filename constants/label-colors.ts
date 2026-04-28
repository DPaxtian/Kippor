export const LABEL_COLORS = {
  red:    { light: { bg: '#FBE5E0', fg: '#B53D2A' }, dark: { bg: '#3A1812', fg: '#E97864' } },
  amber:  { light: { bg: '#FBF1D9', fg: '#8C5E0F' }, dark: { bg: '#2B2010', fg: '#E5B257' } },
  green:  { light: { bg: '#E5F2E4', fg: '#3F7A4C' }, dark: { bg: '#1A2A1C', fg: '#7BB97A' } },
  teal:   { light: { bg: '#D9EFEB', fg: '#1F6E63' }, dark: { bg: '#102624', fg: '#5FB6A8' } },
  blue:   { light: { bg: '#DCE8F2', fg: '#2F5C82' }, dark: { bg: '#13202B', fg: '#7BAACC' } },
  purple: { light: { bg: '#E8DEF1', fg: '#5B3A82' }, dark: { bg: '#1F1530', fg: '#B79CD9' } },
  pink:   { light: { bg: '#F7DCE5', fg: '#A4365A' }, dark: { bg: '#2C1018', fg: '#E69AAE' } },
  gray:   { light: { bg: '#E8E0D8', fg: '#6B5D54' }, dark: { bg: '#332A26', fg: '#B8ADA5' } },
} as const;

export type LabelColorKey = keyof typeof LABEL_COLORS;

export const LABEL_COLOR_KEYS = Object.keys(LABEL_COLORS) as LabelColorKey[];

export function resolveLabelColor(colorKey: string, isDark: boolean) {
  const slot = LABEL_COLORS[colorKey as LabelColorKey] ?? LABEL_COLORS.gray;
  return isDark ? slot.dark : slot.light;
}

export function slugifyLabel(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}
