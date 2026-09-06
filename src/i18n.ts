import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { readStoredValue, writeStoredValue } from './game/storage/browserStorage'
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

/**
 * Reads through `browserStorage` rather than touching `window.localStorage` here.
 *
 * This runs at **module top level** (`lng` below), which is the first thing to execute when
 * `main.tsx` pulls in its imports — before the error handlers are registered and before any React
 * error boundary exists. On a browser that blocks site data the bare property access throws, and
 * the throw escaped everything: a blank page, nothing rendered, nothing reported.
 */
export function getStoredLanguage() {
  return normalizeLanguage(readStoredValue(LANGUAGE_STORAGE_KEY))
}

/** Reports whether the choice was actually persisted — see `savePlayerSettings`. */
export function setStoredLanguage(language: SupportedLanguage) {
  return writeStoredValue(LANGUAGE_STORAGE_KEY, language)
}

/**
 * Keeps `<html lang>` in step with the active language.
 *
 * `index.html` hardcodes `lang="en"`, so without this a Ukrainian page announces itself as English
 * to screen readers, translation prompts and search engines.
 */
function applyDocumentLanguage(language: string) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.lang = normalizeLanguage(language)
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

applyDocumentLanguage(i18n.language)
i18n.on('languageChanged', applyDocumentLanguage)

export default i18n
