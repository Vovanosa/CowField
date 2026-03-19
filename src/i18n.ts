import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en'
import uk from './locales/uk'

export const supportedLanguages = ['en', 'uk'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export function normalizeLanguage(value: unknown): SupportedLanguage {
  if (typeof value === 'string') {
    const shortCode = value.toLowerCase().split('-')[0]

    if (supportedLanguages.includes(shortCode as SupportedLanguage)) {
      return shortCode as SupportedLanguage
    }
  }

  return 'en'
}

export function getPreferredLanguage() {
  if (typeof navigator === 'undefined') {
    return 'en' as SupportedLanguage
  }

  return normalizeLanguage(navigator.language)
}

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    uk: {
      translation: uk,
    },
  },
  lng: getPreferredLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
