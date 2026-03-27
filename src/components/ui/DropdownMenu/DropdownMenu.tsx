import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

import styles from './DropdownMenu.module.css'

type DropdownMenuProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  label: string
  align?: 'start' | 'end'
  role?: 'menu' | 'listbox'
}

type DropdownMenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  active?: boolean
}

export function DropdownMenu({
  children,
  className,
  label,
  align = 'start',
  role = 'menu',
  ...props
}: DropdownMenuProps) {
  return (
    <div
      {...props}
      className={[styles.menu, styles[align], className ?? ''].filter(Boolean).join(' ')}
      role={role}
      aria-label={label}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  className,
  active = false,
  type = 'button',
  ...props
}: DropdownMenuItemProps) {
  return (
    <button
      {...props}
      type={type}
      className={[styles.item, active ? styles.itemActive : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
