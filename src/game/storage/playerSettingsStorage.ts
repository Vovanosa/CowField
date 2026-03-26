import { getStoredLanguage, normalizeLanguage, setStoredLanguage } from '../../i18n'
import type { PlayerSettings } from '../types'

const PLAYER_SETTINGS_STORAGE_KEY = 'cowfield.player-settings'

const listeners = new Set<() => void>()

const defaultPlayerSettings: PlayerSettings = {
  language: getStoredLanguage(),
  soundEffectsEnabled: false,
  soundEffectsVolume: 50,
  musicEnabled: false,
  musicVolume: 50,
  darkModeEnabled: false,
  takeYourTimeEnabled: false,
  autoPlaceDotsEnabled: false,
}

let currentPlayerSettings: PlayerSettings = {
  ...defaultPlayerSettings,
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function clampVolume(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 50
  }

  return Math.min(100, Math.max(0, Math.round(value)))
}

function normalizePlayerSettings(value: unknown): PlayerSettings {
  if (!isObject(value)) {
    return getDefaultPlayerSettings()
  }

  return {
    language: normalizeLanguage(value.language),
    soundEffectsEnabled: value.soundEffectsEnabled === true,
    soundEffectsVolume: clampVolume(value.soundEffectsVolume),
    musicEnabled: value.musicEnabled === true,
    musicVolume: clampVolume(value.musicVolume),
    darkModeEnabled: value.darkModeEnabled === true,
    takeYourTimeEnabled: value.takeYourTimeEnabled === true,
    autoPlaceDotsEnabled: value.autoPlaceDotsEnabled === true,
  }
}

function emitSettingsChanged() {
  listeners.forEach((listener) => listener())
}

function readStoredPlayerSettings() {
  if (typeof window === 'undefined') {
    return getDefaultPlayerSettings()
  }

  const rawValue = window.localStorage.getItem(PLAYER_SETTINGS_STORAGE_KEY)

  if (!rawValue) {
    return getDefaultPlayerSettings()
  }

  try {
    return normalizePlayerSettings(JSON.parse(rawValue) as unknown)
  } catch {
    return getDefaultPlayerSettings()
  }
}

function setCurrentPlayerSettings(settings: PlayerSettings) {
  currentPlayerSettings = settings
}

function persistPlayerSettings(settings: PlayerSettings) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PLAYER_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function getDefaultPlayerSettings(): PlayerSettings {
  return defaultPlayerSettings
}

export function getPlayerSettingsSnapshot(): PlayerSettings {
  return currentPlayerSettings
}

export function subscribeToPlayerSettings(listener: () => void) {
  listeners.add(listener)

  function handleStorage(event: StorageEvent) {
    if (event.key === PLAYER_SETTINGS_STORAGE_KEY || event.key === null) {
      listener()
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage)
  }

  return () => {
    listeners.delete(listener)

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage)
    }
  }
}

export function applyThemeMode(isDarkModeEnabled: boolean) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = isDarkModeEnabled ? 'dark' : 'light'
}

export async function getPlayerSettings() {
  const settings = readStoredPlayerSettings()
  setCurrentPlayerSettings(settings)
  return settings
}

export async function savePlayerSettings(settings: PlayerSettings) {
  const normalizedSettings = normalizePlayerSettings(settings)
  setStoredLanguage(normalizedSettings.language)
  persistPlayerSettings(normalizedSettings)
  setCurrentPlayerSettings(normalizedSettings)
  applyThemeMode(normalizedSettings.darkModeEnabled)
  emitSettingsChanged()
  return normalizedSettings
}

setCurrentPlayerSettings(readStoredPlayerSettings())
