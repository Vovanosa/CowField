import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'

import { Panel } from '../ui'
import styles from './Dialog.module.css'

type DialogProps = {
  title: string
  description?: ReactNode
  actions: ReactNode
  labelledById: string
  describedById?: string
  onBackdropPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
  role?: 'dialog' | 'alertdialog'
}

export function Dialog({
  title,
  description,
  actions,
  labelledById,
  describedById,
  onBackdropPointerDown,
  role = 'dialog',
}: DialogProps) {
  return (
    <div className={styles.backdrop} onPointerDown={onBackdropPointerDown}>
      <Panel
        as="section"
        className={styles.dialog}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledById}
        aria-describedby={describedById}
      >
        <h2 id={labelledById}>{title}</h2>
        {description ? <div id={describedById}>{description}</div> : null}
        <div className={styles.actions}>{actions}</div>
      </Panel>
    </div>
  )
}
