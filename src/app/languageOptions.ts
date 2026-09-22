import deFlag from '../assets/flags/de.svg'
import esFlag from '../assets/flags/es.svg'
import frFlag from '../assets/flags/fr.svg'
import gbFlag from '../assets/flags/gb.svg'
import itFlag from '../assets/flags/it.svg'
import uaFlag from '../assets/flags/ua.svg'
import { getBrowserLanguage } from '../i18n'
import { DEFAULT_LANGUAGE, LANGUAGES, supportedLanguages, type SupportedLanguage } from '../languages'

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
  de: deFlag,
  es: esFlag,
  fr: frFlag,
  it: itFlag,
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

/**
 * **Your language first, then English, then alphabetically.** Exported separately from the sort
 * below so the rule can be read, and checked, without a browser.
 *
 * `first` is what the *browser* asks for, not what is stored and not what is on screen. The one
 * you are reading is already named on the trigger and marked `aria-checked`; putting it at the top
 * would spend the best position saying something the reader can already see. What the top position
 * is worth is *finding* your language in a list you have never opened.
 *
 * When your language **is** English, English takes the first slot and nothing is duplicated — the
 * rule collapses to "English, then alphabetically", which is what it should be.
 *
 * Alphabetical **by the short label**, because that is the text on screen. Sorting by the native
 * name would be more correct in the abstract and visibly arbitrary in practice: `Українська` sorts
 * after every Latin name whatever the reader's alphabet, and the names are not rendered anyway.
 */
export function orderLanguageOptions(
  options: readonly LanguageOption[],
  first: SupportedLanguage | null,
): LanguageOption[] {
  const rank = (option: LanguageOption) => {
    if (option.value === first) return 0
    if (option.value === DEFAULT_LANGUAGE) return 1
    return 2
  }

  return [...options].sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label))
}

/**
 * The order every language control renders in, worked out **once**: `navigator.languages` does not
 * change while a page is open, and a stable array means the list does not reshuffle under a reader
 * who is looking at it.
 *
 * This is a **display** order and nothing else. `supportedLanguages` — declaration order — stays
 * the canonical one for the sitemap, the `hreflang` set and the checker scripts, all of which have
 * to be identical for every visitor.
 */
export const orderedLanguageOptions = orderLanguageOptions(languageOptions, getBrowserLanguage())
