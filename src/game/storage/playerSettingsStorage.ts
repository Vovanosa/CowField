import { getStoredLanguage, normalizeLanguage } from '../../i18n'
import type { PlayerSettings } from '../types'
import { buildAuthenticatedHeaders } from './authSessionStorage'
import { buildApiUrl } from './apiBase'

const SETTINGS_API_BASE = buildApiUrl('/api/settings')

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
    return defaultPlayerSettings
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

export function getDefaultPlayerSettings() {
  return { ...defaultPlayerSettings }
}

export function applyThemeMode(isDarkModeEnabled: boolean) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = isDarkModeEnabled ? 'dark' : 'light'
}

async function requestJson<T>(init?: RequestInit): Promise<T> {
  const response = await fetch(SETTINGS_API_BASE, {
    headers: {
      ...buildAuthenticatedHeaders(),
    },
    ...init,
  })

  if (!response.ok) {
    let message = 'Request failed.'

    try {
      const payload = (await response.json()) as { message?: string }
      message = payload.message ?? message
    } catch {
      // ignore parse error
    }

    throw new Error(message)
  }

  return normalizePlayerSettings((await response.json()) as unknown) as T
}

export async function getPlayerSettings() {
  try {
    return await requestJson<PlayerSettings>()
  } catch {
    return getDefaultPlayerSettings()
  }
}

export async function savePlayerSettings(settings: PlayerSettings) {
  return requestJson<PlayerSettings>({
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}
