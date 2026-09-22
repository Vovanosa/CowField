import { ChevronDown, Globe, Share2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { orderedLanguageOptions } from '../../app/languageOptions'
import { LanguageLink, Link, useLanguage } from '../../app/navigation'
import { LANGUAGES, localizePath } from '../../i18n'
import { ShareDialog } from '../ShareDialog'
import { useDropdownMenu } from '../ui'
import styles from './SiteFooter.module.css'

/**
 * The five public pages, on every page inside the shell.
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
  // Last on purpose. It is the page fewest readers want and the one that most needs to be reachable
  // from everywhere, which is exactly what a footer slot is for.
  { to: '/about-project', label: 'About the project' },
] as const

export function SiteFooter() {
  const { t } = useTranslation()
  const language = useLanguage()
  const languagePickerRef = useRef<HTMLDetailsElement>(null)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const closeLanguagePicker = useCallback(() => setIsLanguageOpen(false), [])
  const [isShareOpen, setIsShareOpen] = useState(false)

  useDropdownMenu<HTMLDetailsElement>({
    containerRef: languagePickerRef,
    isOpen: isLanguageOpen,
    onClose: closeLanguagePicker,
  })

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
          **`<details>`, and that is the whole reason this can be a dropdown at all.**

          This control is the site's only crawlable path between the language trees. It used to be
          one plain link per other language, sitting in the row — safe, and increasingly silly as
          languages were added. Collapsing them into a menu is exactly the mistake that cost a week
          of `/uk` going uncrawled in 2026-09-19: Googlebot follows links, it does not open menus,
          and `hreflang` is an alternates hint rather than a path.

          A closed `<details>` still has its contents in the DOM — the browser hides them, they are
          never absent — so every `<a href>` below is read on the first pass whether or not anyone
          clicks. The same trick the FAQ on `/about` uses for its answers, for the same reason. The
          React version of this, `{isOpen && <ul>…</ul>}`, would render nothing until a click and
          would quietly undo the fix.

          `open` is mirrored into state only so `useDropdownMenu` can close it on Escape or an
          outside click; the element stays the source of truth via `onToggle`.
        */}
        <details
          ref={languagePickerRef}
          className={styles.languagePicker}
          open={isLanguageOpen}
          onToggle={(event) => setIsLanguageOpen(event.currentTarget.open)}
        >
          {/*
            **The word, not a language name.** It named the language the reader most likely wanted
            next — "English" on a German page — which read as a link to English rather than as a
            way to choose, and the arrow beside it did not fix that.

            Naming the *current* language would be honest but close to useless: the whole page is
            already in it. What a reader cannot tell by looking is what this control is **for**, so
            that is what it says.

            The accessible name adds the current language after it, because a screen-reader user
            cannot glance at the page to find out which one they are in. The visible text stays the
            start of the accessible name, which is what WCAG asks for.
          */}
          <summary
            className={`${styles.link} ${styles.languageSummary}`}
            aria-label={`${t('Language')}: ${LANGUAGES[language].nativeName}`}
          >
            <Globe size={15} aria-hidden="true" />
            <span>{t('Language')}</span>
            <ChevronDown className={styles.languageChevron} size={15} aria-hidden="true" />
          </summary>
          <ul className={styles.languageList}>
            {orderedLanguageOptions.map((option) => (
              <li key={option.value}>
                <LanguageLink
                  className={styles.languageOption}
                  language={option.value}
                  aria-current={option.value === language ? 'true' : undefined}
                  onClick={closeLanguagePicker}
                >
                  <img
                    className={styles.languageFlag}
                    src={option.flag}
                    alt=""
                    aria-hidden="true"
                  />
                  <span>{option.nativeName}</span>
                </LanguageLink>
              </li>
            ))}
          </ul>
        </details>

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
