import type { ReactNode } from 'react'

import { Panel } from '../Panel'
import styles from './StatusMessage.module.css'

export type StatusMessageProps = {
  message: ReactNode
  variant?: 'neutral' | 'warning'
  compact?: boolean
  className?: string
}

export function StatusMessage({
  message,
  variant = 'neutral',
  compact = false,
  className,
}: StatusMessageProps) {
  return (
    <Panel
      compact={compact}
      className={[styles.message, styles[variant], className ?? ''].filter(Boolean).join(' ')}
    >
      <p className={styles.copy}>{message}</p>
    </Panel>
  )
}
