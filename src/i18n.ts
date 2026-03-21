import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en'
import uk from './locales/uk'

export const supportedLanguages = ['en', 'uk'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]
export const LANGUAGE_STORAGE_KEY = 'cowfield.language'

export function normalizeLanguage(value: unknown): SupportedLanguage {
  if (typeof value === 'string') {
    const shortCode = value.toLowerCase().split('-')[0]

    if (supportedLanguages.includes(shortCode as SupportedLanguage)) {
      return shortCode as SupportedLanguage
    }
  }

  return 'en'
}

export function getStoredLanguage() {
  if (typeof window === 'undefined') {
    return 'en' as SupportedLanguage
  }

  const storedValue = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return normalizeLanguage(storedValue)
}

export function setStoredLanguage(language: SupportedLanguage) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
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
  lng: getStoredLanguage(),
  fallbackLng: 'en',
  keySeparator: false,
  nsSeparator: false,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
