/**
 * Everything that is true of a language, and nothing that is true of i18next.
 *
 * **One row in `LANGUAGES` per language, and adding one is that row plus a dictionary file.**
 * Before this existed the same two-language assumption was written out in nine places — the prefix
 * table, the switcher's flags, the settings page's options, `PlayerLanguage`, both checker scripts,
 * `robots.txt` and every `hreflang` set in `sitemap.xml` — and nothing connected them, so a third
 * language meant finding all nine and getting all nine right.
 *
 * **Why it is not simply part of `i18n.ts`.** This file imports nothing at all, deliberately.
 * `i18n.ts` pulls in i18next, react-i18next and `browserStorage`, none of which a Node script can
 * load, and `scripts/build-seo-files.mts` has to read the same table the router routes on — or the
 * sitemap and the app can disagree about which languages exist, which is exactly the class of drift
 * that is invisible until a crawler finds it. `i18n.ts` re-exports all of this, so nothing in the
 * app has to know the split happened.
 */

export type LanguageDefinition = {
  /**
   * Where this language lives in the URL, with no trailing slash.
   *
   * The prefix is the *only* place the shape of a localised URL is written down; everything that
   * builds, reads or mirrors a path goes through the functions below.
   */
  prefix: string
  /** The language's own name for itself. Never translated — that is the point of it. */
  nativeName: string
  /** Two or three characters for the switcher pill, where the full name will not fit. */
  shortLabel: string
}

/**
 * **Every language carries a prefix, including the default one.**
 *
 * English used to be the site root with no prefix at all (scope P18, decision D1), which cost
 * nothing while there were two languages and got steadily worse as a position: `/` meant both "the
 * site" and "the English site", the default language was the one case every helper here had to
 * special-case, and a third language would have been a guest in someone else's URL space. Moving
 * English to `/en` on 2026-09-21 made the rule uniform — *a page is at `/<language>/<path>`, always*
 * — at the cost of a one-time round of permanent redirects, which `vercel.json` carries.
 *
 * Declaration order is the order the switcher shows and the order the sitemap lists, so the default
 * language goes first.
 */
export const LANGUAGES = {
  en: { prefix: '/en', nativeName: 'English', shortLabel: 'EN' },
  de: { prefix: '/de', nativeName: 'Deutsch', shortLabel: 'DE' },
  es: { prefix: '/es', nativeName: 'Español', shortLabel: 'ES' },
  fr: { prefix: '/fr', nativeName: 'Français', shortLabel: 'FR' },
  it: { prefix: '/it', nativeName: 'Italiano', shortLabel: 'IT' },
  uk: { prefix: '/uk', nativeName: 'Українська', shortLabel: 'UA' },
} as const satisfies Record<string, LanguageDefinition>

export type SupportedLanguage = keyof typeof LANGUAGES

/**
 * What an unrecognised preference falls back to, what `/` sends a visitor to when nothing better is
 * known about them, what `x-default` points at, and i18next's `fallbackLng`.
 *
 * `satisfies` rather than an annotation, so the type stays `'en'` and not `SupportedLanguage`:
 * `i18n.ts` subtracts it from the lazy-dictionary map, which only works on a literal.
 */
export const DEFAULT_LANGUAGE = 'en' satisfies SupportedLanguage

export const supportedLanguages = Object.keys(LANGUAGES) as readonly SupportedLanguage[]

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return value in LANGUAGES
}

/** A stored value, a URL fragment or an `Accept-Language` tag, narrowed to something we can render. */
export function normalizeLanguage(value: unknown): SupportedLanguage {
  if (typeof value === 'string') {
    const shortCode = value.toLowerCase().split('-')[0]

    if (isSupportedLanguage(shortCode)) {
      return shortCode
    }
  }

  return DEFAULT_LANGUAGE
}

/**
 * The language a path **actually names**, or `null` for a path that names none: `/`, and the
 * handful of unprefixed URLs that have to keep working (`/verify-email` and the OAuth callback are
 * registered with Neon Auth and arrive in emails).
 *
 * Separate from `languageFromPathname` below, which answers the different question *"what should
 * this render in"* and therefore never returns `null`. Mixing the two is what makes a prefixless
 * default language quietly dangerous: while English was `''`, "no prefix found" and "English" were
 * the same answer, and `stripLanguagePrefix` could not tell a bare `/verify-email` from an English
 * one. Now it can, and the difference is this function.
 *
 * Matches a prefix as a whole segment, so `/ukraine` names no language rather than Ukrainian.
 */
export function matchedLanguage(pathname: string): SupportedLanguage | null {
  for (const language of supportedLanguages) {
    const prefix = LANGUAGES[language].prefix

    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return language
    }
  }

  return null
}

/**
 * Which language a path renders in. The URL is the source of truth — a stored preference never
 * overrides the page you are actually on, or `/uk/about` would render English and become a
 * duplicate of `/en/about`.
 */
export function languageFromPathname(pathname: string): SupportedLanguage {
  return matchedLanguage(pathname) ?? DEFAULT_LANGUAGE
}

/** The language-neutral path: `/uk/about` and `/en/about` both come back as `/about`, `/uk` as `/`. */
export function stripLanguagePrefix(pathname: string): string {
  const language = matchedLanguage(pathname)

  if (!language) {
    return pathname || '/'
  }

  const remainder = pathname.slice(LANGUAGES[language].prefix.length)

  return remainder.startsWith('/') ? remainder : '/'
}

/**
 * The same page, in the given language. **Idempotent**: it strips whatever prefix is already there
 * before adding the right one, so passing an already-localised path is safe and double prefixes
 * (`/uk/uk/about`) cannot happen.
 */
export function localizePath(path: string, language: SupportedLanguage): string {
  const prefix = LANGUAGES[language].prefix
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
 * The paths that stay outside every language tree, because something we do not control already has
 * them written down.
 *
 * `authSessionStorage.ts` hands all three to Neon Auth as absolute URLs: the OAuth callback is
 * registered in its console, and the other two arrive in emails that are already in people's
 * inboxes. Prefixing them would break a sign-up that started before the deploy, which is the kind
 * of failure nobody reports — they just do not come back.
 */
export const UNPREFIXED_PATHS = ['/auth/google/callback', '/verify-email', '/reset-password']
