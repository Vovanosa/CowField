import type { ButtonHTMLAttributes, ReactNode } from 'react'

import styles from './ControlButton.module.css'

export type ControlButtonSize = 'sm' | 'md'

export type ControlButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  size?: ControlButtonSize
  fullWidth?: boolean
}

export function ControlButton({
  children,
  className,
  type = 'button',
  size = 'md',
  fullWidth = false,
  disabled = false,
  ...props
}: ControlButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      className={[
        styles.button,
        styles[size],
        fullWidth ? styles.fullWidth : '',
        disabled ? styles.disabled : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
