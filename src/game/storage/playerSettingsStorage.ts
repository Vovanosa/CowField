import i18n, {
  LANGUAGE_STORAGE_KEY,
  getStoredLanguage,
  normalizeLanguage,
  setStoredLanguage,
} from '../../i18n'
import { readStoredValue, writeStoredValue } from './browserStorage'
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

/**
 * What a save actually achieved.
 *
 * `isPersisted` is false when the browser refused the write — site data blocked, or a full quota.
 * The change still applies to this session either way; the flag exists so the Settings page can say
 * it will not survive the tab instead of silently pretending it saved.
 */
export type PlayerSettingsSaveResult = {
  settings: PlayerSettings
  isPersisted: boolean
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
  const rawValue = readStoredValue(PLAYER_SETTINGS_STORAGE_KEY)

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
  return writeStoredValue(PLAYER_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

/**
 * Pulls another tab's write into this tab.
 *
 * The `storage` event was already being listened for, but all it did was call the React subscriber
 * — and the snapshot that subscriber then re-read is this module's cache, which nothing refreshed.
 * So every cross-tab change re-rendered with the identical object and looked inert. Re-reading here
 * is what the listener was always missing.
 *
 * The theme and the language are pulled across too: both are global page state, and a settings page
 * showing "Ukrainian, dark" over an English page in light mode is worse than not syncing at all.
 */
function refreshFromStorage() {
  const nextSettings = readStoredPlayerSettings()

  setCurrentPlayerSettings(nextSettings)
  applyThemeMode(nextSettings.darkModeEnabled)

  if (i18n.language !== nextSettings.language) {
    void i18n.changeLanguage(nextSettings.language)
  }

  emitSettingsChanged()
}

function handleStorageEvent(event: StorageEvent) {
  // `key === null` is a `localStorage.clear()` in another tab, which is also a change.
  if (
    event.key === PLAYER_SETTINGS_STORAGE_KEY ||
    event.key === LANGUAGE_STORAGE_KEY ||
    event.key === null
  ) {
    refreshFromStorage()
  }
}

export function applyThemeMode(isDarkModeEnabled: boolean) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = isDarkModeEnabled ? 'dark' : 'light'
}

export function getDefaultPlayerSettings(): PlayerSettings {
  return defaultPlayerSettings
}

export function getPlayerSettingsSnapshot(): PlayerSettings {
  return currentPlayerSettings
}

/**
 * One window listener for the whole app, not one per subscriber.
 *
 * Every React component using `usePlayerSettings` subscribes, and each used to register its own
 * `storage` handler — so a single cross-tab write would have re-read storage once per mounted
 * component. Attaching on the first subscriber and detaching on the last keeps it at one.
 */
export function subscribeToPlayerSettings(listener: () => void) {
  const isFirstListener = listeners.size === 0

  listeners.add(listener)

  if (isFirstListener && typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent)
  }

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent)
    }
  }
}

export async function getPlayerSettings() {
  const settings = readStoredPlayerSettings()
  setCurrentPlayerSettings(settings)
  return settings
}

/**
 * Applies a settings change, and reports whether it was written to disk.
 *
 * **In-memory first, storage second.** It used to persist first — and the very first statement was
 * `setStoredLanguage`, which throws on a browser with site data blocked. The throw left the
 * in-memory settings untouched and escaped into a `void`-ed call, so the toggle silently snapped
 * back and *the whole change was discarded*, not just its persistence. Ordering it this way means a
 * browser that cannot store anything still honours every setting for the life of the tab.
 *
 * Synchronous on purpose: nothing here awaits, and returning a promise only invited the `void` that
 * hid the failure in the first place.
 */
export function savePlayerSettings(settings: PlayerSettings): PlayerSettingsSaveResult {
  const normalizedSettings = normalizePlayerSettings(settings)

  setCurrentPlayerSettings(normalizedSettings)
  applyThemeMode(normalizedSettings.darkModeEnabled)
  emitSettingsChanged()

  // Both writes are attempted even if the first fails; a partial save is still better than none,
  // and short-circuiting would make the language the only thing that can block the rest.
  const isLanguagePersisted = setStoredLanguage(normalizedSettings.language)
  const areSettingsPersisted = persistPlayerSettings(normalizedSettings)

  return {
    settings: normalizedSettings,
    isPersisted: isLanguagePersisted && areSettingsPersisted,
  }
}

setCurrentPlayerSettings(readStoredPlayerSettings())
