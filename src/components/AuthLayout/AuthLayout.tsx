import type { ReactNode } from 'react'

import { Panel } from '../ui'
import styles from './AuthLayout.module.css'

/**
 * A message with the tone it is meant to be read in.
 *
 * This used to be a `string` plus an `isErrorMessage` boolean that defaulted to false, and every
 * page got it wrong in one direction or the other. Login and Register passed `Boolean(message)`, so
 * *any* message was styled as a failure — "Verification email sent again." and "Account created."
 * both came out red. Forgot and Reset passed nothing at all, so a failed request was styled exactly
 * like a success. Pairing the text with its tone at the point the message is created removes the
 * default that was being guessed at.
 */
export type AuthMessage = {
  text: string
  tone: 'error' | 'success'
}

type AuthLayoutProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  /**
   * Pass `null` for "no message right now" rather than omitting it: the region is then rendered
   * empty and stays in the DOM, which is what makes it announce later changes — a live region
   * created at the same moment as its content is not reliably read out — and keeps the panel from
   * jumping when the first message arrives.
   */
  message?: AuthMessage | null
  links?: ReactNode
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  message,
  links,
}: AuthLayoutProps) {
  const hasMessageRegion = message !== undefined
  const isError = message?.tone === 'error'

  return (
    <div className={styles.authPage}>
      <Panel className={styles.authPanel}>
        <div className={styles.authHeader}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        {children}

        {hasMessageRegion ? (
          <p
            className={[styles.message, isError ? styles.messageError : styles.messageSuccess]
              .filter(Boolean)
              .join(' ')}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
          >
            {message?.text ?? ''}
          </p>
        ) : null}

        {links ? <div className={styles.links}>{links}</div> : null}
      </Panel>
    </div>
  )
}
