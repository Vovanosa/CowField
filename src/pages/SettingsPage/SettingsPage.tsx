import { Music4, Sparkles, TimerOff, Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../app/useAuth'
import { SettingsItem } from '../../components/SettingsItem'
import { PageHeader, Panel } from '../../components/ui'
import { playSoundEffect } from '../../game/audio/audioManager'
import { savePlayerSettings } from '../../game/storage/playerSettingsStorage'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import styles from './SettingsPage.module.css'

type ToggleSettingKey =
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

export function SettingsPage() {
  const { isGuest } = useAuth()
  const settings = usePlayerSettings()
  const { t } = useTranslation()

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

  function getSettingTitle(key: ToggleSettingKey) {
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
        eyebrow={t('Settings')}
        title={t('Settings')}
        description={t('Adjust your preferences here.')}
      />

      <Panel className={styles.settingsPanel}>
        {isGuest ? <p className={styles.guestNote}>{t('You are playing as a Guest.')}</p> : null}
        <div className={styles.settingsList}>
          {settingsConfig.map((setting, index) => {
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
                showDivider={index > 0}
              />
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
