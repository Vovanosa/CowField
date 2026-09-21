import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { reportUnexpectedError } from './app/reportUnexpectedError'
import { readStoredValue, writeStoredValue } from './game/storage/browserStorage'
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  matchedLanguage,
  normalizeLanguage,
  type SupportedLanguage,
} from './languages'
import en from './locales/en'

/**
 * The language table, the URL prefixes and the path helpers live in `./languages`, which imports
 * nothing and can therefore be read by a Node script as well as by the app. Re-exported here so
 * every call site can keep importing them from `../i18n`, which is where they have always been.
 */
export * from './languages'

export const LANGUAGE_STORAGE_KEY = 'cowfield.language'

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
 * The best guess for a visitor at a URL that names no language — `/`, and the unprefixed auth
 * callbacks. It is the whole of what `/` does: see `LanguageGateway` in `AppRouter`.
 *
 * **Their own choice, then their browser's, then English.** `getStoredLanguage` cannot do this job
 * because it normalises a missing value to English, so "chose English" and "has never been here"
 * come back identical — and the second of those is the case worth reading `navigator.languages`
 * for. A first-time visitor whose browser asks for Ukrainian now gets Ukrainian, which is the point
 * of giving every language a URL in the first place.
 *
 * Nothing here runs for a crawler in any way that matters: Googlebot stores nothing and sends no
 * preference, so it takes the default and lands on the same `/en` every time.
 */
export function getPreferredLanguage(): SupportedLanguage {
  const stored = readStoredValue(LANGUAGE_STORAGE_KEY)

  if (typeof stored === 'string' && isSupportedLanguage(stored)) {
    return stored
  }

  const offered =
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])

  for (const tag of offered) {
    const shortCode = String(tag).toLowerCase().split('-')[0]

    if (isSupportedLanguage(shortCode)) {
      return shortCode
    }
  }

  return DEFAULT_LANGUAGE
}

/**
 * The language a given URL should render in: the one its prefix names, and for a URL that names
 * none, the visitor's own.
 */
export function getLanguageForLocation(pathname: string): SupportedLanguage {
  return matchedLanguage(pathname) ?? getPreferredLanguage()
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return getStoredLanguage()
  }

  return getLanguageForLocation(window.location.pathname)
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

/**
 * **English is the only dictionary in the bundle** (2026-09-20).
 *
 * Both used to be, and both shipped to everyone: the entry graph carried 50 KB of `en.ts` and
 * 65 KB of `uk.ts` on every first load, so an English reader downloaded the whole Ukrainian
 * catalogue to never use a word of it. Measured in the built chunk: 28,536 Cyrillic characters.
 *
 * English stays static because it cannot be deferred — it is the `fallbackLng`, it carries the
 * plural rules, and the keys *are* the English text, so the app is readable the moment it boots even
 * if nothing else arrives. Every other language is fetched by `loadLanguage` below.
 */
void i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  keySeparator: false,
  nsSeparator: false,
  interpolation: {
    escapeValue: false,
  },
})

applyDocumentLanguage(i18n.language)
i18n.on('languageChanged', applyDocumentLanguage)


/**
 * The dictionaries that are **not** in the entry bundle, each behind its own `import()`.
 *
 * Written as a map keyed by language rather than a `switch`, so adding a third language is one line
 * here and a file beside `en.ts` — and so the type stops anyone listing the default language, which
 * is already loaded and must never be fetched twice.
 *
 * The `import()` specifiers have to be literals for the bundler to see them, which is why this map
 * is here rather than a `loader` column in `LANGUAGES`.
 */
const LAZY_DICTIONARIES: Record<
  Exclude<SupportedLanguage, typeof DEFAULT_LANGUAGE>,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  uk: () => import('./locales/uk'),
}

/**
 * Makes sure the given language's strings are in memory. Cheap and synchronous-ish for the default
 * language and for a language already fetched; one chunk over the network otherwise.
 */
async function loadLanguage(language: SupportedLanguage) {
  if (language === DEFAULT_LANGUAGE || i18n.hasResourceBundle(language, 'translation')) {
    return
  }

  const dictionary = await LAZY_DICTIONARIES[language]()

  i18n.addResourceBundle(language, 'translation', dictionary.default, true, true)
}

/**
 * Switch the UI to a language, fetching its dictionary first if it is not here yet.
 *
 * **Every language change goes through this**, including the first one at boot: `init` sets `lng`
 * from the URL, but with no bundle for it i18next resolves to English, and only `changeLanguage`
 * after `addResourceBundle` makes it resolve again.
 *
 * **A failed fetch is a degraded page, not a broken one.** It is reported and then ignored, and the
 * switch still happens: every key in this project *is* its English text, so a missing dictionary
 * renders readable English rather than a grid of `translation.missing` — which is exactly why the
 * English one is the half that stays in the bundle.
 */
export async function applyLanguage(language: SupportedLanguage) {
  try {
    await loadLanguage(language)
  } catch (error) {
    reportUnexpectedError(error, `loading the ${language} dictionary`)
  }

  await i18n.changeLanguage(language)
}

export default i18n
