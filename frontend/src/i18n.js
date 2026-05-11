import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translations are bundled inline — no HTTP backend needed.
// Using Backend alongside inline resources causes i18next to try fetching
// /locales/en/translation.json which doesn't exist as a static file in production.
import en from './locales/en/translation.json';
import rw from './locales/rw/translation.json';
import fr from './locales/fr/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      rw: { translation: rw },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'rw', 'fr'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
