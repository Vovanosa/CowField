import { useSyncExternalStore } from 'react'

import { getDefaultPlayerSettings, getPlayerSettingsSnapshot, subscribeToPlayerSettings } from './storage'

export function usePlayerSettings() {
  return useSyncExternalStore(
    subscribeToPlayerSettings,
    getPlayerSettingsSnapshot,
    getDefaultPlayerSettings,
  )
}
