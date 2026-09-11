import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { useNavigate } from '../../app/navigation'
import { reportUnexpectedError } from '../../app/reportUnexpectedError'
import { withReturnTo } from '../../app/returnTo'
import { useAuth } from '../../app/useAuth'
import { Button, StatusMessage } from '../../components/ui'
import styles from './GameAccessGate.module.css'

type GameAccessGateProps = {
  children: ReactNode
  t: (key: string, options?: Record<string, unknown>) => string
}

/**
 * What a signed-out visitor sees on a level: **the real board, blurred, behind one choice.**
 *
 * The board underneath is genuinely loaded and genuinely this level's — not a placeholder. That is
 * the whole argument for the pattern (scope decision D2): a shared link shows you the puzzle you
 * were sent, at the size and shape it really is, before asking anything. The alternative we
 * considered was letting people play immediately and asking later; the gate was chosen instead
 * because a session that starts on purpose is one the player knows they have.
 *
 * **`inert` rather than styling alone.** `pointer-events: none` stops a mouse and nothing else — the
 * cells are still buttons, still in the tab order, still announced. `inert` takes the whole subtree
 * out of focus and out of the accessibility tree, so a keyboard or screen-reader user meets the same
 * two buttons everyone else does instead of a board they cannot use.
 *
 * *Play as guest* **does not navigate**. It mints a session and this component stops rendering,
 * leaving the board already loaded underneath — no reload, no second wait, no losing the level.
 */
export function GameAccessGate({ children, t }: GameAccessGateProps) {
  const { isAuthenticated, isLoading, loginAsGuest } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // While the session is still resolving there is no question to ask yet. Rendering the gate here
  // would flash it at every returning player for the tick the bootstrap takes.
  if (isAuthenticated || isLoading) {
    return <>{children}</>
  }

  async function handlePlayAsGuest() {
    setIsStarting(true)
    setError(null)

    try {
      await loginAsGuest()
    } catch (requestError) {
      reportUnexpectedError(requestError, 'guest start from the level gate')
      // The API sleeps when idle, so this is as likely to be a cold start as a real failure.
      setError(t("Couldn't start a game. Check your connection and try again."))
      setIsStarting(false)
    }
  }

  return (
    <div className={styles.gate}>
      <div className={styles.board} inert>
        {children}
      </div>

      <div className={styles.overlay}>
        <div className={styles.card}>
          <h2 className={styles.title}>{t('Ready when you are')}</h2>
          <p className={styles.description}>
            {t('Play right away without an account, or make one so your times follow you between devices.')}
          </p>

          <div className={styles.actions}>
            <Button
              variant="primary"
              onClick={() => void handlePlayAsGuest()}
              disabled={isStarting}
              fullWidth
            >
              {isStarting ? t('Starting...') : t('Play as guest')}
            </Button>
            <Button onClick={() => navigate(withReturnTo('/register', pathname))} fullWidth>
              {t('Create account')}
            </Button>
          </div>

          {error ? <StatusMessage message={error} variant="warning" compact /> : null}
        </div>
      </div>
    </div>
  )
}
