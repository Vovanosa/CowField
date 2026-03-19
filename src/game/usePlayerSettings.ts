import { useEffect, useState } from 'react'

import { getPlayerSettings } from './storage'
import type { PlayerSettings } from './types'

export function usePlayerSettings() {
  const [settings, setSettings] = useState<PlayerSettings | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadSettings() {
      const nextSettings = await getPlayerSettings()

      if (!isActive) {
        return
      }

      setSettings(nextSettings)
    }

    void loadSettings()

    return () => {
      isActive = false
    }
  }, [])

  return settings
}
