import { ArrowLeft, MoonStar, Music4, Sparkles, TimerOff, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/useAuth'
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
  icon: typeof Music4
  volumeKey?: VolumeSettingKey
}> = [
  {
    key: 'soundEffectsEnabled',
    icon: Volume2,
    volumeKey: 'soundEffectsVolume',
  },
  {
    key: 'musicEnabled',
    icon: Music4,
    volumeKey: 'musicVolume',
  },
  {
    key: 'darkModeEnabled',
    icon: MoonStar,
  },
  {
    key: 'takeYourTimeEnabled',
    icon: TimerOff,
  },
  {
    key: 'autoPlaceDotsEnabled',
    icon: Sparkles,
  },
]

export function SettingsPage() {
  const { isGuest } = useAuth()
  const [settings, setSettings] = useState<PlayerSettings | null>(null)
  const hasLoadedSettingsRef = useRef(false)
  const previousSettingsRef = useRef<PlayerSettings | null>(null)
  const { t } = useTranslation()

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

    if (isGuest && key === 'takeYourTimeEnabled') {
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

  function getSettingTitle(key: ToggleSettingKey) {
    if (key === 'soundEffectsEnabled') {
      return t('Sound effects')
    }

    if (key === 'musicEnabled') {
      return t('Music')
    }

    if (key === 'darkModeEnabled') {
      return t('Dark mode')
    }

    if (key === 'takeYourTimeEnabled') {
      return t('Take your time')
    }

    return t('Auto-place dots')
  }

  function getSettingDescription(key: ToggleSettingKey) {
    if (key === 'soundEffectsEnabled') {
      return t('Enable interface and gameplay sound effects.')
    }

    if (key === 'musicEnabled') {
      return t('Enable background music during play.')
    }

    if (key === 'darkModeEnabled') {
      return t('Use a darker visual theme for low-light play.')
    }

    if (key === 'takeYourTimeEnabled') {
      return t('Hide visible timers so play can stay fully relaxed.')
    }

    return t('Automatically place helper dots around confirmed bull placements.')
  }

  return (
    <div className={`${styles.simplePage} page-shell`}>
      <div className={styles.pageIntroRow}>
        <Link className="round-icon-link" to="/" aria-label={t('Back to home')}>
          <ArrowLeft size={16} />
        </Link>
        <PageIntro
          eyebrow={t('Settings')}
          title={t('Settings')}
          description={t('Adjust player preferences here. These switches are remembered by the backend.')}
        />
      </div>

      <section className={`${styles.settingsPanel} panel-surface`}>
        {!settings ? <p className={styles.loadingMessage}>{t('Loading settings...')}</p> : null}
        {settings && isGuest ? <p className={styles.guestNote}>{t('You are playing as a Guest.')}</p> : null}
        <div className={styles.settingsList}>
          {settings ? (
            <>
              {settingsConfig.map((setting) => {
                const Icon = setting.icon
                const isEnabled = settings[setting.key]
                const isDisabled = isGuest && setting.key === 'takeYourTimeEnabled'

                return (
                  <article key={setting.key} className={styles.settingCard}>
                    <div className={styles.settingMainRow}>
                      <div className={styles.settingInfo}>
                        <span className={styles.settingIcon}>
                          <Icon size={18} />
                        </span>
                        <div className={styles.settingCopy}>
                          <h2 className={styles.settingTitle}>{getSettingTitle(setting.key)}</h2>
                          <p className={styles.settingDescription}>
                            {getSettingDescription(setting.key)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={isEnabled ? `${styles.toggle} ${styles.toggleActive}` : styles.toggle}
                        onClick={() => handleToggle(setting.key)}
                        aria-pressed={isEnabled}
                        disabled={isDisabled}
                      >
                        <span className={styles.toggleThumb} />
                      </button>
                    </div>

                    {setting.volumeKey && isEnabled ? (
                      <div className={styles.sliderRow}>
                        <div className={styles.sliderHeader}>
                          <p className={styles.sliderLabel}>{t('Volume')}</p>
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
              })}
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}
