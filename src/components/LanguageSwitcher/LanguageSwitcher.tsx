import { MoonStar, SunMedium } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { languageOptionFor, orderedLanguageOptions } from '../../app/languageOptions'
import { LanguageLink, useLanguage } from '../../app/navigation'
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
  const current = languageOptionFor(language)

  const closeLanguageMenu = useCallback(() => {
    setIsLanguageMenuOpen(false)
  }, [])

  useDropdownMenu({
    containerRef: languageMenuRef,
    isOpen: isLanguageMenuOpen,
    onClose: closeLanguageMenu,
  })

  /**
   * Records the **preference for the next visit** — what the gateway at `/` should send this
   * reader to when they come back with no language in the URL. It is not what changes the page.
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
    Inside the profile dropdown the two settings are labelled rows, and the language picker is a row
    of flag buttons rather than a second dropdown. A menu nested inside a menu is worse to use and
    worse to describe to a screen reader.

    The row wraps and then scrolls at two rows — see `.menuLanguages`. On a phone this sits inside
    a dropdown that is already most of the screen, so it is the one place where a long list has to
    be capped rather than allowed to push everything else down.
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
            {orderedLanguageOptions.map((option) => (
              <LanguageLink
                key={option.value}
                language={option.value}
                className={
                  language === option.value
                    ? `${styles.menuLanguage} ${styles.menuLanguageActive}`
                    : styles.menuLanguage
                }
                role="radio"
                aria-checked={language === option.value}
                aria-label={option.nativeName}
                onClick={() => handleLanguageSelect(option.value)}
              >
                <img
                  className={styles.languageOptionFlag}
                  src={option.flag}
                  alt=""
                  aria-hidden="true"
                />
                <span className={styles.languageOptionCode}>{option.label}</span>
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
          onClick={() => setIsLanguageMenuOpen((isOpen) => !isOpen)}
        >
          <img
            className={styles.languageTriggerFlag}
            src={current.flag}
            alt=""
            aria-hidden="true"
          />
          <span className={styles.languageTriggerCode}>{current.label}</span>
        </button>

        {isLanguageMenuOpen ? (
          <DropdownMenu className={styles.languageMenu} role="menu" label={t('Language')} align="end">
            {/*
              Links rather than buttons, because choosing a language goes somewhere: the URL is real,
              so these can be middle-clicked and copied. `role="menuitemradio"` stays — inside a
              `role="menu"` an item has to carry a menu role, and keeping it means the keyboard and
              screen-reader behaviour P10 established is unchanged.

              `aria-label` is the language's own name for itself, so a screen reader announces
              "Українська" — pronounced in Ukrainian, because `LanguageLink` sets `lang` — rather
              than spelling out "UA". The visible pill stays two characters wide.
            */}
            {orderedLanguageOptions.map((option) => (
              <LanguageLink
                key={option.value}
                language={option.value}
                className={dropdownMenuItemClassName(
                  language === option.value,
                  styles.languageOption,
                )}
                onClick={() => handleLanguageSelect(option.value)}
                role="menuitemradio"
                aria-checked={language === option.value}
                aria-label={option.nativeName}
              >
                <img
                  className={styles.languageOptionFlag}
                  src={option.flag}
                  alt=""
                  aria-hidden="true"
                />
                <span className={styles.languageOptionCode}>{option.label}</span>
              </LanguageLink>
            ))}
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  )
}
