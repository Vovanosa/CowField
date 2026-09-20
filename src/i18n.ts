import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { reportUnexpectedError } from './app/reportUnexpectedError'
import { readStoredValue, writeStoredValue } from './game/storage/browserStorage'
import en from './locales/en'

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
 * Where each language lives in the URL.
 *
 * **English is the root and carries no prefix**; Ukrainian sits under `/uk`. That asymmetry is
 * deliberate (scope P18, decision D1): every URL Google had already indexed keeps working with no
 * redirect, and the language that earns the traffic today pays no cost for the one being added.
 *
 * The prefix is the *only* place the shape of a localised URL is written down. Everything that
 * builds, reads or mirrors a path goes through the four functions below.
 */
export const LANGUAGE_PATH_PREFIXES: Record<SupportedLanguage, string> = {
  en: '',
  uk: '/uk',
}

const prefixedLanguages = supportedLanguages.filter(
  (language) => LANGUAGE_PATH_PREFIXES[language] !== '',
)

/**
 * Which language a path declares. The URL is the source of truth — a stored preference never
 * overrides the page you are actually on, or `/uk/about` would render English and become a
 * duplicate of `/about`.
 *
 * Matches the prefix as a whole segment, so `/ukraine` is an English path and not a Ukrainian one.
 */
export function languageFromPathname(pathname: string): SupportedLanguage {
  for (const language of prefixedLanguages) {
    const prefix = LANGUAGE_PATH_PREFIXES[language]

    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return language
    }
  }

  return 'en'
}

/** The language-neutral path: `/uk/about` and `/about` both come back as `/about`, `/uk` as `/`. */
export function stripLanguagePrefix(pathname: string): string {
  const prefix = LANGUAGE_PATH_PREFIXES[languageFromPathname(pathname)]

  if (!prefix) {
    return pathname || '/'
  }

  const remainder = pathname.slice(prefix.length)

  return remainder.startsWith('/') ? remainder : '/'
}

/**
 * The same page, in the given language. **Idempotent**: it strips whatever prefix is already there
 * before adding the right one, so passing an already-localised path is safe and double prefixes
 * (`/uk/uk/about`) cannot happen.
 */
export function localizePath(path: string, language: SupportedLanguage): string {
  const prefix = LANGUAGE_PATH_PREFIXES[language]
  const neutralPath = stripLanguagePrefix(path.startsWith('/') ? path : `/${path}`)

  if (!prefix) {
    return neutralPath
  }

  return neutralPath === '/' ? prefix : `${prefix}${neutralPath}`
}

/** `localizePath` for a path that may carry a query string or a hash, which must survive untouched. */
export function localizeHref(href: string, language: SupportedLanguage): string {
  const markerIndex = href.search(/[?#]/)

  if (markerIndex === -1) {
    return localizePath(href, language)
  }

  return `${localizePath(href.slice(0, markerIndex), language)}${href.slice(markerIndex)}`
}

/**
 * What the language switcher navigates to: this page, in the other language, keeping the query and
 * hash. Switching language is **navigation**, not a client-side re-render — see `LanguageSwitcher`.
 */
export function mirrorLocationForLanguage(
  location: { pathname: string; search?: string; hash?: string },
  language: SupportedLanguage,
): string {
  return `${localizePath(location.pathname, language)}${location.search ?? ''}${location.hash ?? ''}`
}

/**
 * The language a given URL should render in.
 *
 * The URL decides everywhere **except `/`** (scope P18, decision D7): the root is the one path
 * where a returning visitor's stored preference wins, and `AppRouter` turns that into a redirect to
 * `/uk`. A crawler has no stored preference, so `/` is always English to it.
 */
export function getLanguageForLocation(pathname: string): SupportedLanguage {
  return pathname === '/' ? getStoredLanguage() : languageFromPathname(pathname)
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
 * if nothing else arrives. Ukrainian is fetched by `loadLanguage` below.
 */
void i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
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
 * here and a file beside `en.ts` — and so the type stops anyone listing English, which is already
 * loaded and must never be fetched twice.
 */
const LAZY_DICTIONARIES: Record<
  Exclude<SupportedLanguage, 'en'>,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  uk: () => import('./locales/uk'),
}

/**
 * Makes sure the given language's strings are in memory. Cheap and synchronous-ish for English and
 * for a language already fetched; one chunk over the network otherwise.
 */
async function loadLanguage(language: SupportedLanguage) {
  if (language === 'en' || i18n.hasResourceBundle(language, 'translation')) {
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
