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
  className?: string
  descriptionClassName?: string
  actionsClassName?: string
}

export function Dialog({
  title,
  description,
  actions,
  labelledById,
  describedById,
  onBackdropPointerDown,
  role = 'dialog',
  className,
  descriptionClassName,
  actionsClassName,
}: DialogProps) {
  const dialogClassName = className ? `${styles.dialog} ${className}` : styles.dialog
  const resolvedActionsClassName = actionsClassName
    ? `${styles.actions} ${actionsClassName}`
    : styles.actions

  return (
    <div className={styles.backdrop} onPointerDown={onBackdropPointerDown}>
      <Panel
        as="section"
        className={dialogClassName}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledById}
        aria-describedby={describedById}
      >
        <h2 id={labelledById}>{title}</h2>
        {description ? (
          <div id={describedById} className={descriptionClassName}>
            {description}
          </div>
        ) : null}
        <div className={resolvedActionsClassName}>{actions}</div>
      </Panel>
    </div>
  )
}
