import { Globe2, Keyboard, MoonStar, Music4, Sparkles, TimerOff, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { orderedLanguageOptions } from '../../app/languageOptions'
import { useLanguage, useSwitchLanguage } from '../../app/navigation'
import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { useAuth } from '../../app/useAuth'
import {
  KeyboardShortcutsDialog,
  useShortcutSheetKey,
} from '../../components/KeyboardShortcutsDialog'
import { SettingsItem } from '../../components/SettingsItem'
import { Button, PageHeader, Panel } from '../../components/ui'
import { playSoundEffect } from '../../game/audio/audioManager'
import { savePlayerSettings } from '../../game/storage/playerSettingsStorage'
import type { PlayerSettings } from '../../game/types'
import type { PlayerLanguage } from '../../game/types/settings'
import { usePlayerSettings } from '../../game/usePlayerSettings'
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

export function SettingsPage() {
  const { isGuest } = useAuth()
  const settings = usePlayerSettings()
  // The URL decides what language the page is in; `settings.language` is only the preference for
  // the next visit. See `LanguageSwitcher`, which makes the same distinction.
  const language = useLanguage()
  const switchLanguage = useSwitchLanguage()
  const { t } = useTranslation()
  useDocumentMeta({ title: brandedTitle(t('Settings')), robots: 'noindex' })
  const [hasStorageFailed, setHasStorageFailed] = useState(false)
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false)

  // `?` works here too. The row is how someone finds the feature; the key working on the row's own
  // dialog is how they find out the key exists.
  useShortcutSheetKey({
    isOpen: isShortcutsDialogOpen,
    onToggle: () => setIsShortcutsDialogOpen((isOpen) => !isOpen),
  })

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
    if (language === nextLanguage) {
      return
    }

    playSoundEffect('uiClick')

    applySettingsChange({
      ...settings,
      language: nextLanguage,
    })
    switchLanguage(nextLanguage)
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
      return t('Switch to dark colours for playing in low light.')
    }

    if (key === 'soundEffectsEnabled') {
      return t('Enable sound effects.')
    }

    if (key === 'musicEnabled') {
      return t('Enable background music during play.')
    }

    if (key === 'takeYourTimeEnabled') {
      return t('Hide the timers so nothing on screen is counting.')
    }

    return t('Ring each bull with dots the moment you place it.')
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
              /* Only rendered below 768px, and never last when it is, so it always wants its rule. */
              showDivider
              control={
                <div className={styles.languageControl} role="group" aria-label={t('Language')}>
                  {orderedLanguageOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={[
                        styles.languageOption,
                        language === option.value ? styles.languageOptionActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={language === option.value}
                      aria-label={option.nativeName}
                      onClick={() => handleLanguageChange(option.value)}
                    >
                      <img className={styles.languageOptionFlag} src={option.flag} alt="" aria-hidden="true" />
                      <span>{option.label}</span>
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
                /*
                  Every row draws the rule under itself now, because the Keyboard shortcuts row
                  below is always last and always present. It was `index < length - 1` while the
                  final toggle was the last thing on the page — see the note in
                  `SettingsItem.module.css`.
                */
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
          {/*
            Not a setting — a way in. There is nothing here to configure, because the shortcuts only
            fire on a focused board and so cannot get in anyone's way; what they need is to be
            findable by someone who would never guess `?`.
          */}
          <SettingsItem
            icon={Keyboard}
            title={t('Keyboard shortcuts')}
            description={t('See the keys for playing without a mouse.')}
            control={
              <Button size="sm" onClick={() => setIsShortcutsDialogOpen(true)}>
                {t('View')}
              </Button>
            }
          />
        </div>
      </Panel>

      {isShortcutsDialogOpen ? (
        <KeyboardShortcutsDialog onClose={() => setIsShortcutsDialogOpen(false)} />
      ) : null}
    </div>
  )
}
