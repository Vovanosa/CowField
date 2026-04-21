import { Globe2, MoonStar, Music4, Sparkles, TimerOff, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../app/useAuth'
import gbFlag from '../../assets/flags/gb.svg'
import uaFlag from '../../assets/flags/ua.svg'
import { SettingsItem } from '../../components/SettingsItem'
import { PageHeader, Panel } from '../../components/ui'
import { playSoundEffect } from '../../game/audio/audioManager'
import { savePlayerSettings } from '../../game/storage/playerSettingsStorage'
import type { PlayerLanguage } from '../../game/types/settings'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import i18n from '../../i18n'
import styles from './SettingsPage.module.css'

type ToggleSettingKey =
  | 'darkModeEnabled'
  | 'soundEffectsEnabled'
  | 'musicEnabled'
  | 'takeYourTimeEnabled'
  | 'autoPlaceDotsEnabled'

type VolumeSettingKey = 'soundEffectsVolume' | 'musicVolume'

const settingsConfig: Array<{
  key: ToggleSettingKey
  icon: typeof Music4
  volumeKey?: VolumeSettingKey
}> = [
  {
    key: 'darkModeEnabled',
    icon: MoonStar,
  },
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
    key: 'takeYourTimeEnabled',
    icon: TimerOff,
  },
  {
    key: 'autoPlaceDotsEnabled',
    icon: Sparkles,
  },
]

const languageOptions: Array<{
  value: PlayerLanguage
  code: 'EN' | 'UA'
  flag: string
}> = [
  {
    value: 'en',
    code: 'EN',
    flag: gbFlag,
  },
  {
    value: 'uk',
    code: 'UA',
    flag: uaFlag,
  },
]

export function SettingsPage() {
  const { isGuest } = useAuth()
  const settings = usePlayerSettings()
  const { t } = useTranslation()
  const [areFloatingControlsHidden, setAreFloatingControlsHidden] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia('(max-width: 768px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)')

    function syncFloatingControlVisibility() {
      setAreFloatingControlsHidden(mediaQuery.matches)
    }

    syncFloatingControlVisibility()
    mediaQuery.addEventListener('change', syncFloatingControlVisibility)

    return () => {
      mediaQuery.removeEventListener('change', syncFloatingControlVisibility)
    }
  }, [])

  function handleToggle(key: ToggleSettingKey) {
    if (isGuest && key === 'takeYourTimeEnabled') {
      return
    }

    playSoundEffect('uiClick')

    const nextSettings = {
      ...settings,
      [key]: !settings[key],
    }

    void savePlayerSettings(nextSettings)
  }

  function handleVolumeChange(key: VolumeSettingKey, value: number) {
    playSoundEffect('uiClick')

    void savePlayerSettings({
      ...settings,
      [key]: value,
    })
  }

  function handleLanguageChange(nextLanguage: PlayerLanguage) {
    if (settings.language === nextLanguage) {
      return
    }

    playSoundEffect('uiClick')

    void savePlayerSettings({
      ...settings,
      language: nextLanguage,
    })
    void i18n.changeLanguage(nextLanguage)
  }

  function getSettingTitle(key: ToggleSettingKey) {
    if (key === 'darkModeEnabled') {
      return t('Dark mode')
    }

    if (key === 'soundEffectsEnabled') {
      return t('Sound effects')
    }

    if (key === 'musicEnabled') {
      return t('Music')
    }

    if (key === 'takeYourTimeEnabled') {
      return t('Take your time')
    }

    return t('Auto-place dots')
  }

  function getSettingDescription(key: ToggleSettingKey) {
    if (key === 'darkModeEnabled') {
      return t('Use a darker visual theme for low-light play.')
    }

    if (key === 'soundEffectsEnabled') {
      return t('Enable sound effects.')
    }

    if (key === 'musicEnabled') {
      return t('Enable background music during play.')
    }

    if (key === 'takeYourTimeEnabled') {
      return t('Hide visible timers so play can stay fully relaxed.')
    }

    return t('Automatically place helper dots around confirmed bull placements.')
  }

  return (
    <div className={`${styles.simplePage} page-shell`}>
      <PageHeader
        backTo="/"
        backLabel={t('Back to home')}
        title={t('Settings')}
        description={t('Adjust your preferences here.')}
      />

      <Panel className={styles.settingsPanel}>
        {isGuest ? <p className={styles.guestNote}>{t('You are playing as a Guest.')}</p> : null}
        <div className={styles.settingsList}>
          {areFloatingControlsHidden ? (
            <SettingsItem
              icon={Globe2}
              title={t('Language')}
              description={t('Choose the language used across the game.')}
              controlBelow
              control={
                <div className={styles.languageControl} role="group" aria-label={t('Language')}>
                  {languageOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={[
                        styles.languageOption,
                        settings.language === option.value ? styles.languageOptionActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={settings.language === option.value}
                      onClick={() => handleLanguageChange(option.value)}
                    >
                      <img className={styles.languageOptionFlag} src={option.flag} alt="" aria-hidden="true" />
                      <span>{option.code}</span>
                    </button>
                  ))}
                </div>
              }
            />
          ) : null}
          {settingsConfig
            .filter((setting) => areFloatingControlsHidden || setting.key !== 'darkModeEnabled')
            .map((setting) => {
            const isEnabled =
              isGuest && setting.key === 'takeYourTimeEnabled' ? true : settings[setting.key]
            const isDisabled = isGuest && setting.key === 'takeYourTimeEnabled'

            return (
              <SettingsItem
                key={setting.key}
                icon={setting.icon}
                title={getSettingTitle(setting.key)}
                description={getSettingDescription(setting.key)}
                checked={isEnabled}
                disabled={isDisabled}
                onToggle={() => handleToggle(setting.key)}
                volume={setting.volumeKey && isEnabled ? settings[setting.volumeKey] : undefined}
                volumeLabel={t('Volume')}
                onVolumeChange={
                  setting.volumeKey && isEnabled
                    ? (value) => handleVolumeChange(setting.volumeKey!, value)
                    : undefined
                }
                showDivider
              />
            )
            })}
        </div>
      </Panel>
    </div>
  )
}
