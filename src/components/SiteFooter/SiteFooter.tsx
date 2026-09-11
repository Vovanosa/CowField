import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

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

export function SiteFooter() {
  const { t } = useTranslation()

  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label={t('Site links')}>
        {LINKS.map((link) => (
          <Link key={link.to} className={styles.link} to={link.to}>
            {t(link.label)}
          </Link>
        ))}
      </nav>
    </footer>
  )
}
