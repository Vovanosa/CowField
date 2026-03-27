import type { ReactNode } from 'react'

import { Panel } from '../ui'
import styles from './AuthLayout.module.css'

type AuthLayoutProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  message?: string
  isErrorMessage?: boolean
  links?: ReactNode
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  message,
  isErrorMessage = false,
  links,
}: AuthLayoutProps) {
  return (
    <div className={styles.authPage}>
      <Panel className={styles.authPanel}>
        <div className={styles.authHeader}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        {children}

        {message !== undefined ? (
          <p className={isErrorMessage ? `${styles.message} ${styles.messageError}` : styles.message}>
            {message}
          </p>
        ) : null}

        {links ? <div className={styles.links}>{links}</div> : null}
      </Panel>
    </div>
  )
}
