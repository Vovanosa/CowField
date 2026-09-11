import { useTranslation } from 'react-i18next'

import { languageFromPathname, localizePath } from '../../i18n'
import { Button } from '../ui'
import { EmptyState } from '../EmptyState'
import styles from './ErrorBoundary.module.css'

/**
 * Home, in the language the reader was already in.
 *
 * A bare `/` would drop a Ukrainian reader into the English site, and the crash is not the moment to
 * also change the language on them. Read from the path rather than from `i18n`, because this screen
 * can render from the top-level boundary where the crash may well have been i18n itself.
 */
function getHomeHref() {
  const { pathname, origin } = window.location

  return `${origin}${localizePath('/', languageFromPathname(pathname))}`
}

/**
 * The fallback shown once something has thrown.
 *
 * Both recovery actions are plain `onClick` handlers rather than router links on purpose: this
 * renders from the top-level boundary too, which sits outside `RouterProvider` and has no router
 * context to navigate with. A full document load is also the right recovery here — it rebuilds the
 * state that just broke instead of re-entering it.
 */
export function ErrorScreen() {
  const { t } = useTranslation()

  return (
    <div className={styles.screen}>
      <EmptyState
        className={styles.panel}
        message={t('Something went wrong. Reloading the page usually fixes it.')}
        actions={
          <>
            <Button variant="primary" onClick={() => window.location.reload()}>
              {t('Reload the page')}
            </Button>
            <Button onClick={() => window.location.assign(getHomeHref())}>
              {t('Back to home')}
            </Button>
          </>
        }
      />
    </div>
  )
}
