import gbFlag from '../assets/flags/gb.svg'
import uaFlag from '../assets/flags/ua.svg'
import { LANGUAGES, supportedLanguages, type SupportedLanguage } from '../languages'

/**
 * The switcher's view of `LANGUAGES` — the one list both places that let a reader change language
 * render from.
 *
 * It is separate from `src/languages.ts` for the same reason that file is separate from `i18n.ts`:
 * these are Vite asset imports, and `scripts/build-seo-files.mts` reads the language table under
 * plain Node, where an `import` of an SVG is a syntax error waiting to happen. The table stays
 * loadable everywhere; the flags stay here.
 *
 * A **`Record`** and not a lookup with a fallback, so adding a language to `LANGUAGES` without a
 * flag beside it fails to compile rather than rendering a gap in the menu.
 */
const FLAGS: Record<SupportedLanguage, string> = {
  en: gbFlag,
  uk: uaFlag,
}

export type LanguageOption = {
  value: SupportedLanguage
  /** Two or three characters, for the pill. */
  label: string
  /** The language's own name for itself, for anywhere with room for it. */
  nativeName: string
  flag: string
}

export const languageOptions: LanguageOption[] = supportedLanguages.map((value) => ({
  value,
  label: LANGUAGES[value].shortLabel,
  nativeName: LANGUAGES[value].nativeName,
  flag: FLAGS[value],
}))

export function languageOptionFor(language: SupportedLanguage): LanguageOption {
  // Non-null because `languageOptions` is built from `supportedLanguages`, which is the type's
  // own domain — there is no language without a row.
  return languageOptions.find((option) => option.value === language)!
}
