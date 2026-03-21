import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import gbFlag from '../../assets/flags/gb.svg'
import uaFlag from '../../assets/flags/ua.svg'
import i18n, {
  getStoredLanguage,
  normalizeLanguage,
  setStoredLanguage,
  type SupportedLanguage,
} from '../../i18n'
import './LanguageSwitcher.css'

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const [language, setLanguage] = useState<SupportedLanguage>(getStoredLanguage())
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const currentFlag = language === 'uk' ? uaFlag : gbFlag

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

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  async function handleLanguageSelect(nextLanguage: SupportedLanguage) {
    setLanguage(nextLanguage)
    setIsMenuOpen(false)
    setStoredLanguage(nextLanguage)
    void i18n.changeLanguage(nextLanguage)
  }

  return (
    <div className="language-switcher" ref={menuRef}>
      <button
        type="button"
        className="language-trigger"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label={t('Language')}
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        <img
          className="language-trigger-flag"
          src={currentFlag}
          alt=""
          aria-hidden="true"
        />
        <span className="language-trigger-code">{language === 'uk' ? 'UA' : 'EN'}</span>
      </button>

      {isMenuOpen ? (
        <div className="language-menu" role="menu" aria-label={t('Language')}>
          <button
            type="button"
            className={language === 'en' ? 'language-option language-option-active' : 'language-option'}
            onClick={() => void handleLanguageSelect('en')}
            role="menuitemradio"
            aria-checked={language === 'en'}
          >
            <img className="language-option-flag" src={gbFlag} alt="" aria-hidden="true" />
            <span className="language-option-code">EN</span>
          </button>
          <button
            type="button"
            className={language === 'uk' ? 'language-option language-option-active' : 'language-option'}
            onClick={() => void handleLanguageSelect('uk')}
            role="menuitemradio"
            aria-checked={language === 'uk'}
          >
            <img className="language-option-flag" src={uaFlag} alt="" aria-hidden="true" />
            <span className="language-option-code">UA</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
