import { MoonStar, SunMedium } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageLink, useLanguage } from '../../app/navigation'
import gbFlag from '../../assets/flags/gb.svg'
import uaFlag from '../../assets/flags/ua.svg'
import { savePlayerSettings } from '../../game/storage/playerSettingsStorage'
import { usePlayerSettings } from '../../game/usePlayerSettings'
import type { SupportedLanguage } from '../../i18n'
import { DropdownMenu, dropdownMenuItemClassName, useDropdownMenu } from '../ui'
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
   * state here is not local — the language lives in the URL and the theme in player settings, and
   * both instances read the same source — so a second copy in the DOM costs two buttons and keeps
   * the switch on a media query, where it belongs.
   */
  variant?: 'pills' | 'menu'
}

export function LanguageSwitcher({ variant = 'pills' }: LanguageSwitcherProps = {}) {
  const { t } = useTranslation()
  const settings = usePlayerSettings()
  /*
    The active language is read from the **URL**, not from stored settings.

    Those two can legitimately disagree: a reader whose preference is English can be sent a
    `/uk/about` link, and the page they are looking at is Ukrainian. Before P18 this component held
    its own copy of the stored value and forced i18n to match it on mount, which would now fight the
    route and re-render the Ukrainian page in English.
  */
  const language = useLanguage()
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

  /**
   * Records the **preference for the next visit** — what `/` should redirect to when this reader
   * comes back (decision D7). It is not what changes the page.
   *
   * The navigation is the `LanguageLink`'s own: it renders a real `<a href>` to this page in the
   * other language, and `LanguageRoute` moves i18n to match the new URL. That split is the whole
   * point — calling `i18n.changeLanguage` here instead would translate the UI while leaving the URL,
   * and with it the canonical and the hreflang pair, describing the language the reader just left.
   *
   * It used to call `useSwitchLanguage` as well. A link navigates on its own, so doing both would
   * navigate twice; the hook stays for `SettingsPage`, where the control genuinely is a control.
   */
  function handleLanguageSelect(nextLanguage: SupportedLanguage) {
    closeLanguageMenu()

    if (nextLanguage === language) {
      return
    }

    savePlayerSettings({
      ...settings,
      language: nextLanguage,
    })
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
              <LanguageLink
                key={option}
                language={option}
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
              </LanguageLink>
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
            {/*
              Links rather than buttons, because choosing a language goes somewhere: the URL is real,
              so these can be middle-clicked and copied. `role="menuitemradio"` stays — inside a
              `role="menu"` an item has to carry a menu role, and keeping it means the keyboard and
              screen-reader behaviour P10 established is unchanged.
            */}
            <LanguageLink
              language="en"
              className={dropdownMenuItemClassName(language === 'en', styles.languageOption)}
              onClick={() => handleLanguageSelect('en')}
              role="menuitemradio"
              aria-checked={language === 'en'}
            >
              <img className={styles.languageOptionFlag} src={gbFlag} alt="" aria-hidden="true" />
              <span className={styles.languageOptionCode}>EN</span>
            </LanguageLink>
            <LanguageLink
              language="uk"
              className={dropdownMenuItemClassName(language === 'uk', styles.languageOption)}
              onClick={() => handleLanguageSelect('uk')}
              role="menuitemradio"
              aria-checked={language === 'uk'}
            >
              <img className={styles.languageOptionFlag} src={uaFlag} alt="" aria-hidden="true" />
              <span className={styles.languageOptionCode}>UA</span>
            </LanguageLink>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  )
}
