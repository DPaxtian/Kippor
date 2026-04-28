import { useUIStore } from '@/store/ui-store';
import { es, enUS, ptBR } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const DATE_LOCALES: Record<string, Locale> = {
  es,
  en: enUS,
  pt: ptBR,
};

// Formato de fecha larga nativo por idioma
const DATE_FORMATS: Record<string, string> = {
  es: "d 'de' MMMM, yyyy",
  en: 'MMMM d, yyyy',
  pt: "d 'de' MMMM 'de' yyyy",
};

// Formato de encabezado del día (sin año)
const DAY_HEADER_FORMATS: Record<string, string> = {
  es: "EEEE d 'de' MMMM",
  en: 'EEEE, MMMM d',
  pt: "EEEE, d 'de' MMMM",
};

export function useDateLocale(): Locale {
  const language = useUIStore((s) => s.language);
  return DATE_LOCALES[language] ?? es;
}

export function useDateFormat(): string {
  const language = useUIStore((s) => s.language);
  return DATE_FORMATS[language] ?? DATE_FORMATS.es;
}

export function useDayHeaderFormat(): string {
  const language = useUIStore((s) => s.language);
  return DAY_HEADER_FORMATS[language] ?? DAY_HEADER_FORMATS.es;
}
