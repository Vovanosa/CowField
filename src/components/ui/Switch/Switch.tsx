import type { ButtonHTMLAttributes } from 'react'

import styles from './Switch.module.css'

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  checked: boolean
}

export function Switch({
  checked,
  className,
  disabled = false,
  type = 'button',
  ...props
}: SwitchProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      aria-pressed={checked}
      className={[styles.switch, checked ? styles.active : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.thumb} />
    </button>
  )
}
