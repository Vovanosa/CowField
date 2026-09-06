import { Globe2, MoonStar, Music4, Sparkles, TimerOff, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../app/useAuth'
import gbFlag from '../../assets/flags/gb.svg'
import uaFlag from '../../assets/flags/ua.svg'
import { SettingsItem } from '../../components/SettingsItem'
import { PageHeader, Panel } from '../../components/ui'
import { playSoundEffect } from '../../game/audio/audioManager'
import { savePlayerSettings } from '../../game/storage/playerSettingsStorage'
import type { PlayerSettings } from '../../game/types'
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
  const [hasStorageFailed, setHasStorageFailed] = useState(false)

  /**
   * Every change goes through here so the one failure case is handled in one place: the setting
   * applies to this session regardless, and `isPersisted` says whether it will still be there
   * tomorrow. Nothing used to read that — the call was `void`-ed and a browser refusing to store
   * anything reported success.
   */
  function applySettingsChange(nextSettings: PlayerSettings) {
    const result = savePlayerSettings(nextSettings)
    setHasStorageFailed(!result.isPersisted)
  }

  function handleToggle(key: ToggleSettingKey) {
    if (isGuest && key === 'takeYourTimeEnabled') {
      return
    }

    playSoundEffect('uiClick')

    applySettingsChange({
      ...settings,
      [key]: !settings[key],
    })
  }

  function handleVolumeChange(key: VolumeSettingKey, value: number) {
    playSoundEffect('uiClick')

    applySettingsChange({
      ...settings,
      [key]: value,
    })
  }

  function handleLanguageChange(nextLanguage: PlayerLanguage) {
    if (settings.language === nextLanguage) {
      return
    }

    playSoundEffect('uiClick')

    applySettingsChange({
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
        {hasStorageFailed ? (
          <p className={styles.storageNote} role="status">
            {t('This browser is blocking saved data, so these choices will reset when you close the tab.')}
          </p>
        ) : null}
        <div className={styles.settingsList}>
          {/*
            Language and Dark mode live in the frame's control row on wide screens and move in here
            when it hides. That used to be decided by `matchMedia('(max-width: 768px)')` — a second
            copy of a number that only CSS should own, and getting the two out of step duplicated the
            controls or made them vanish. Both rows are always rendered now; `.narrowOnly` shows them
            under the *same* `max-width: 768px` prelude that hides the pills.
          */}
          <div className={styles.narrowOnly}>
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
          </div>
          {settingsConfig.map((setting) => {
            const isEnabled =
              isGuest && setting.key === 'takeYourTimeEnabled' ? true : settings[setting.key]
            const isDisabled = isGuest && setting.key === 'takeYourTimeEnabled'

            const item = (
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

            // Dark mode is the other control that lives in the frame's pills on wide screens.
            return setting.key === 'darkModeEnabled' ? (
              <div key={setting.key} className={styles.narrowOnly}>
                {item}
              </div>
            ) : (
              item
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
