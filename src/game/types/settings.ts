export type PlayerLanguage = 'en' | 'uk'

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
