import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import es from './es';
import en from './en';
import pt from './pt';

export type AppLanguage = 'es' | 'en' | 'pt';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['es', 'en', 'pt'];

export function detectDeviceLanguage(): AppLanguage {
  const locale = getLocales()[0]?.languageCode ?? 'es';
  if (locale.startsWith('pt')) return 'pt';
  if (locale.startsWith('en')) return 'en';
  return 'es';
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
