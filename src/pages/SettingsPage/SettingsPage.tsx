import { ArrowLeft, MoonStar, Music4, Sparkles, TimerOff, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageIntro } from '../../components/PageIntro'
import { applyThemeMode, getPlayerSettings, savePlayerSettings } from '../../game/storage'
import type { PlayerSettings } from '../../game/types'
import styles from './SettingsPage.module.css'

type ToggleSettingKey =
  | 'soundEffectsEnabled'
  | 'musicEnabled'
  | 'darkModeEnabled'
  | 'takeYourTimeEnabled'
  | 'autoPlaceDotsEnabled'

type VolumeSettingKey = 'soundEffectsVolume' | 'musicVolume'

const settingsConfig: Array<{
  key: ToggleSettingKey
  title: string
  description: string
  icon: typeof Music4
  volumeKey?: VolumeSettingKey
}> = [
  {
    key: 'soundEffectsEnabled',
    title: 'Sound effects',
    description: 'Enable interface and gameplay sound effects.',
    icon: Volume2,
    volumeKey: 'soundEffectsVolume',
  },
  {
    key: 'musicEnabled',
    title: 'Music',
    description: 'Enable background music during play.',
    icon: Music4,
    volumeKey: 'musicVolume',
  },
  {
    key: 'darkModeEnabled',
    title: 'Dark mode',
    description: 'Use a darker visual theme for low-light play.',
    icon: MoonStar,
  },
  {
    key: 'takeYourTimeEnabled',
    title: 'Take your time',
    description: 'Hide visible timers so play can stay fully relaxed.',
    icon: TimerOff,
  },
  {
    key: 'autoPlaceDotsEnabled',
    title: 'Auto-place dots',
    description: 'Automatically place helper dots around confirmed bull placements.',
    icon: Sparkles,
  },
]

export function SettingsPage() {
  const [settings, setSettings] = useState<PlayerSettings | null>(null)
  const hasLoadedSettingsRef = useRef(false)
  const previousSettingsRef = useRef<PlayerSettings | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadSettings() {
      const nextSettings = await getPlayerSettings()

      if (!isActive) {
        return
      }

      setSettings(nextSettings)
      applyThemeMode(nextSettings.darkModeEnabled)
      hasLoadedSettingsRef.current = true
      previousSettingsRef.current = nextSettings
    }

    void loadSettings()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!settings || !hasLoadedSettingsRef.current) {
      return
    }

    const previousSettings = previousSettingsRef.current

    if (!previousSettings) {
      previousSettingsRef.current = settings
      return
    }

    const didVolumeChange =
      previousSettings.soundEffectsVolume !== settings.soundEffectsVolume ||
      previousSettings.musicVolume !== settings.musicVolume

    const didNonVolumeSettingChange =
      previousSettings.soundEffectsEnabled !== settings.soundEffectsEnabled ||
      previousSettings.musicEnabled !== settings.musicEnabled ||
      previousSettings.darkModeEnabled !== settings.darkModeEnabled ||
      previousSettings.takeYourTimeEnabled !== settings.takeYourTimeEnabled ||
      previousSettings.autoPlaceDotsEnabled !== settings.autoPlaceDotsEnabled

    previousSettingsRef.current = settings

    if (!didVolumeChange || didNonVolumeSettingChange) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void savePlayerSettings(settings)
    }, 1000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [settings])

  function handleToggle(key: ToggleSettingKey) {
    if (!settings) {
      return
    }

    const nextSettings = {
      ...settings,
      [key]: !settings[key],
    }

    if (key === 'darkModeEnabled') {
      applyThemeMode(nextSettings.darkModeEnabled)
    }

    setSettings(nextSettings)
    previousSettingsRef.current = nextSettings
    void savePlayerSettings(nextSettings)
  }

  function handleVolumeChange(key: VolumeSettingKey, value: number) {
    if (!settings) {
      return
    }

    setSettings((currentSettings) => ({
      ...(currentSettings as PlayerSettings),
      [key]: value,
    }))
  }

  return (
    <div className={`${styles.simplePage} page-shell`}>
      <div className={styles.pageIntroRow}>
        <Link className="round-icon-link" to="/" aria-label="Back to home">
          <ArrowLeft size={16} />
        </Link>
        <PageIntro
          eyebrow="Settings"
          title="Settings"
          description="Adjust player preferences here. These switches are remembered by the backend."
        />
      </div>

      <section className={`${styles.settingsPanel} panel-surface`}>
        {!settings ? <p className={styles.loadingMessage}>Loading settings...</p> : null}
        <div className={styles.settingsList}>
          {settings ? settingsConfig.map((setting) => {
            const Icon = setting.icon
            const isEnabled = settings[setting.key]

            return (
              <article key={setting.key} className={styles.settingCard}>
                <div className={styles.settingMainRow}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingIcon}>
                      <Icon size={18} />
                    </span>
                    <div className={styles.settingCopy}>
                      <h2 className={styles.settingTitle}>{setting.title}</h2>
                      <p className={styles.settingDescription}>{setting.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={isEnabled ? `${styles.toggle} ${styles.toggleActive}` : styles.toggle}
                    onClick={() => handleToggle(setting.key)}
                    aria-pressed={isEnabled}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>

                {setting.volumeKey && isEnabled ? (
                  <div className={styles.sliderRow}>
                    <div className={styles.sliderHeader}>
                      <p className={styles.sliderLabel}>Volume</p>
                      <span className={styles.sliderValue}>{settings[setting.volumeKey]}%</span>
                    </div>
                    <input
                      className={styles.slider}
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={settings[setting.volumeKey]}
                      onChange={(event) =>
                        handleVolumeChange(setting.volumeKey!, Number(event.target.value))
                      }
                    />
                  </div>
                ) : null}
              </article>
            )
          }) : null}
        </div>
      </section>
    </div>
  )
}
