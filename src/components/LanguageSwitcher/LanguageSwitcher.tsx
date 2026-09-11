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

type LanguageSwitcherProps = {
  /**
   * Where this instance is being rendered.
   *
   * `pills` is the pair of floating controls in the shell's top-right corner. `menu` is the same two
   * settings as labelled rows inside the profile dropdown, for the widths where the pills would
   * crowd the page title.
   *
   * **Both are always rendered and CSS picks one**, rather than a width hook choosing in JS. The
   * state here is not local — the language lives in i18n and the theme in player settings, and both
   * instances read the same source — so a second copy in the DOM costs two buttons and keeps the
   * switch on a media query, where it belongs.
   */
  variant?: 'pills' | 'menu'
}

export function LanguageSwitcher({ variant = 'pills' }: LanguageSwitcherProps = {}) {
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

  function handleLanguageSelect(nextLanguage: SupportedLanguage) {
    setLanguage(nextLanguage)
    closeLanguageMenu()
    savePlayerSettings({
      ...settings,
      language: nextLanguage,
    })
    void i18n.changeLanguage(nextLanguage)
  }

  function handleThemeToggle() {
    savePlayerSettings({
      ...settings,
      darkModeEnabled: !settings.darkModeEnabled,
    })
  }

  const themeToggle = (
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
  )

  /*
    Inside the profile dropdown the two settings are labelled rows, and the language picker is two
    flag buttons rather than a second dropdown. A menu nested inside a menu is worse to use and
    worse to describe to a screen reader, and there are exactly two languages.
  */
  if (variant === 'menu') {
    return (
      <div className={styles.menuVariant}>
        <div className={styles.menuRow}>
          <span className={styles.menuLabel}>{t('Dark mode')}</span>
          {themeToggle}
        </div>
        <div className={styles.menuRow}>
          <span className={styles.menuLabel}>{t('Language')}</span>
          <div className={styles.menuLanguages} role="radiogroup" aria-label={t('Language')}>
            {(['en', 'uk'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={
                  language === option
                    ? `${styles.menuLanguage} ${styles.menuLanguageActive}`
                    : styles.menuLanguage
                }
                role="radio"
                aria-checked={language === option}
                onClick={() => handleLanguageSelect(option)}
              >
                <img
                  className={styles.languageOptionFlag}
                  src={option === 'uk' ? uaFlag : gbFlag}
                  alt=""
                  aria-hidden="true"
                />
                <span className={styles.languageOptionCode}>{option === 'uk' ? 'UA' : 'EN'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
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
              onClick={() => handleLanguageSelect('en')}
              role="menuitemradio"
              aria-checked={language === 'en'}
            >
              <img className={styles.languageOptionFlag} src={gbFlag} alt="" aria-hidden="true" />
              <span className={styles.languageOptionCode}>EN</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className={styles.languageOption}
              active={language === 'uk'}
              onClick={() => handleLanguageSelect('uk')}
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
