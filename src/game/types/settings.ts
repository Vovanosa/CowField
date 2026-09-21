import type { SupportedLanguage } from '../../languages'

/**
 * An alias rather than its own union. It was `'en' | 'uk'` written out a second time, which meant
 * a language added to `LANGUAGES` typechecked everywhere except in stored settings — the one place
 * where being wrong is silent, because `normalizeLanguage` would quietly rewrite the stored value
 * back to English on the next read.
 */
export type PlayerLanguage = SupportedLanguage

export type PlayerSettings = {
  language: PlayerLanguage
  soundEffectsEnabled: boolean
  soundEffectsVolume: number
  musicEnabled: boolean
  musicVolume: number
  darkModeEnabled: boolean
  takeYourTimeEnabled: boolean
  autoPlaceDotsEnabled: boolean
}
