import { MoonStar, SunMedium } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import gbFlag from '../../assets/flags/gb.svg'
import uaFlag from '../../assets/flags/ua.svg'
import { savePlayerSettings } from '../../game/storage/playerSettingsStorage'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import i18n, {
  getStoredLanguage,
  normalizeLanguage,
  type SupportedLanguage,
} from '../../i18n'
import { DropdownMenu, DropdownMenuItem, useDropdownMenu } from '../ui'
import styles from './LanguageSwitcher.module.css'

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const settings = usePlayerSettings()
  const [language, setLanguage] = useState<SupportedLanguage>(getStoredLanguage())
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const languageMenuRef = useRef<HTMLDivElement | null>(null)
  const currentFlag = language === 'uk' ? uaFlag : gbFlag

  const closeLanguageMenu = useCallback(() => {
    setIsLanguageMenuOpen(false)
  }, [])

  useDropdownMenu({
    containerRef: languageMenuRef,
    isOpen: isLanguageMenuOpen,
    onClose: closeLanguageMenu,
  })

  useEffect(() => {
    const nextLanguage = getStoredLanguage()

    if (normalizeLanguage(i18n.resolvedLanguage) !== nextLanguage) {
      void i18n.changeLanguage(nextLanguage)
    }

    function handleLanguageChanged(nextLanguageCode: string) {
      setLanguage(normalizeLanguage(nextLanguageCode))
    }

    i18n.on('languageChanged', handleLanguageChanged)

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  async function handleLanguageSelect(nextLanguage: SupportedLanguage) {
    setLanguage(nextLanguage)
    closeLanguageMenu()
    void savePlayerSettings({
      ...settings,
      language: nextLanguage,
    })
    void i18n.changeLanguage(nextLanguage)
  }

  function handleThemeToggle() {
    void savePlayerSettings({
      ...settings,
      darkModeEnabled: !settings.darkModeEnabled,
    })
  }

  return (
    <div className={styles.languageSwitcher}>
      <button
        type="button"
        className={
          settings.darkModeEnabled
            ? `${styles.themeTrigger} ${styles.themeTriggerActive}`
            : styles.themeTrigger
        }
        aria-label={settings.darkModeEnabled ? t('Switch to light mode') : t('Switch to dark mode')}
        aria-pressed={settings.darkModeEnabled}
        onClick={handleThemeToggle}
      >
        <span className={styles.themeTriggerTrack}>
          <span className={styles.themeTriggerThumb}>
            {settings.darkModeEnabled ? <MoonStar size={14} /> : <SunMedium size={14} />}
          </span>
        </span>
      </button>

      <div className={styles.languagePicker} ref={languageMenuRef}>
        <button
          type="button"
          className={styles.languageTrigger}
          aria-haspopup="menu"
          aria-expanded={isLanguageMenuOpen}
          aria-label={t('Language')}
          onClick={() => setIsLanguageMenuOpen((current) => !current)}
        >
          <img
            className={styles.languageTriggerFlag}
            src={currentFlag}
            alt=""
            aria-hidden="true"
          />
          <span className={styles.languageTriggerCode}>{language === 'uk' ? 'UA' : 'EN'}</span>
        </button>

        {isLanguageMenuOpen ? (
          <DropdownMenu className={styles.languageMenu} role="menu" label={t('Language')} align="end">
            <DropdownMenuItem
              className={styles.languageOption}
              active={language === 'en'}
              onClick={() => void handleLanguageSelect('en')}
              role="menuitemradio"
              aria-checked={language === 'en'}
            >
              <img className={styles.languageOptionFlag} src={gbFlag} alt="" aria-hidden="true" />
              <span className={styles.languageOptionCode}>EN</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className={styles.languageOption}
              active={language === 'uk'}
              onClick={() => void handleLanguageSelect('uk')}
              role="menuitemradio"
              aria-checked={language === 'uk'}
            >
              <img className={styles.languageOptionFlag} src={uaFlag} alt="" aria-hidden="true" />
              <span className={styles.languageOptionCode}>UA</span>
            </DropdownMenuItem>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  )
}
