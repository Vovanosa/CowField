import type { ReactNode } from 'react'

import { Panel } from '../ui'
import styles from './EmptyState.module.css'

type EmptyStateProps = {
  message: string
  actions?: ReactNode
  className?: string
}

export function EmptyState({ message, actions, className }: EmptyStateProps) {
  return (
    <Panel className={[styles.emptyState, className ?? ''].filter(Boolean).join(' ')}>
      <p className={styles.message}>{message}</p>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </Panel>
  )
}
