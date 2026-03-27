import type { ReactNode } from 'react'

import styles from './Toast.module.css'

export type ToastVariant = 'neutral' | 'success' | 'warning'
export type ToastPlacement = 'bottom-center' | 'bottom-right'

export type ToastProps = {
  title: ReactNode
  details?: string[]
  variant?: ToastVariant
  placement?: ToastPlacement
  className?: string
}

export function Toast({
  title,
  details,
  variant = 'neutral',
  placement = 'bottom-right',
  className,
}: ToastProps) {
  return (
    <div
      className={[
        styles.toast,
        styles[variant],
        placement === 'bottom-center' ? styles.bottomCenter : styles.bottomRight,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      <p className={styles.title}>{title}</p>
      {details?.length ? (
        <ul className={styles.details}>
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
