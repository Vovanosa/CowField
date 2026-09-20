import { Share2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageLink, Link, useLanguage } from '../../app/navigation'
import { localizePath, type SupportedLanguage } from '../../i18n'
import { ShareDialog } from '../ShareDialog'
import styles from './SiteFooter.module.css'

/**
 * The four public pages, on every page inside the shell.
 *
 * **Why a footer and not more home-menu buttons.** Before this, `/how-to-solve` and `/difficulties`
 * could only be reached from a link part-way down `/about`, and the landing page only from inside
 * the profile dropdown — so the shortest path from a game to the rules was three clicks through a
 * menu the reader had no reason to open. Putting the set in the shell makes every public page one
 * click from every other one, which is both the sane thing for a reader and what an internal-linking
 * audit is actually measuring.
 *
 * It also matters to a crawler. These four pages are the entire indexable site; a link to each from
 * every page is how the two new ones get discovered and how they share whatever authority `/` has.
 *
 * **`/welcome` rather than `/`** for the landing page, deliberately: `/` is the home menu for anyone
 * signed in, so it is not the landing page for the people most likely to be reading this. `/welcome`
 * renders it for everyone and hands `/` the canonical, so the two URLs never compete.
 */
const LINKS = [
  { to: '/welcome', label: 'What is CowField?' },
  { to: '/about', label: 'How to play' },
  { to: '/how-to-solve', label: 'Solving techniques' },
  { to: '/difficulties', label: 'Board sizes' },
] as const

/**
 * Each language's name **in that language**, and deliberately not run through `t()`.
 *
 * A language link is the one label on a page that should not follow the page's language: a reader
 * who cannot read this page is exactly the reader who needs to recognise the link out of it. Every
 * bilingual site writes it this way, and it is also why `LanguageLink` sets `lang` on the anchor.
 */
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  uk: 'Українською',
}

/** Two languages, so "the other one" is a flip rather than a list. */
const OTHER_LANGUAGE: Record<SupportedLanguage, SupportedLanguage> = {
  en: 'uk',
  uk: 'en',
}

export function SiteFooter() {
  const { t } = useTranslation()
  const language = useLanguage()
  const otherLanguage = OTHER_LANGUAGE[language]
  const [isShareOpen, setIsShareOpen] = useState(false)

  /*
    **The front door in the reader's own language**, so a Ukrainian player shares `/uk` and their
    reader lands in Ukrainian — the same rule `ShareLevelButton` follows for a board.

    Built from `window.location.origin` rather than a constant, because the three files that
    hardcode the domain exist precisely so nothing else has to: a move to a custom domain must not
    need a fourth.
  */
  const shareUrl =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}${localizePath('/', language)}`

  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label={t('Site links')}>
        {LINKS.map((link) => (
          <Link key={link.to} className={styles.link} to={link.to}>
            {t(link.label)}
          </Link>
        ))}
        {/*
          The site's only crawlable path between the two language trees — see `LanguageLink`. It sits
          in the footer because the footer is rendered once in `AppShell`, outside the keyed route
          stage, so this link is in the DOM of every page in the shell without anyone opening a menu.
        */}
        <LanguageLink
          className={`${styles.link} ${styles.languageLink}`}
          language={otherLanguage}
        >
          {LANGUAGE_NAMES[otherLanguage]}
        </LanguageLink>

        {/*
          A button, not a link — it opens a dialog rather than going anywhere, and making it look
          like its neighbours must not extend to making a crawler follow it.
        */}
        <button
          type="button"
          className={`${styles.link} ${styles.shareButton}`}
          onClick={() => setIsShareOpen(true)}
        >
          <Share2 size={15} aria-hidden="true" />
          <span>{t('Share')}</span>
        </button>
      </nav>

      {isShareOpen ? <ShareDialog url={shareUrl} onClose={() => setIsShareOpen(false)} /> : null}
    </footer>
  )
}
