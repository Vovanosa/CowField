import type { ButtonHTMLAttributes, ReactNode } from 'react'

import styles from './ToolChip.module.css'

export type ToolChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  children: ReactNode
}

export function ToolChip({
  active = false,
  children,
  className,
  type = 'button',
  ...props
}: ToolChipProps) {
  return (
    <button
      {...props}
      type={type}
      className={[styles.chip, active ? styles.active : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
