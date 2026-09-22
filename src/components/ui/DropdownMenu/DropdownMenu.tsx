import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

import { handleListArrowNavigation } from '../../../app/listArrowNavigation'
import { MENU_ITEM_SELECTOR } from './menuItemSelector'
import styles from './DropdownMenu.module.css'
import { dropdownMenuItemClassName } from './dropdownMenuItemClassName'

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
  onKeyDown,
  ...props
}: DropdownMenuProps) {
  return (
    <div
      {...props}
      className={[styles.menu, styles[align], className ?? ''].filter(Boolean).join(' ')}
      role={role}
      aria-label={label}
      /*
        Arrows move between the items, which is what `role="menu"` promises and what none of these
        menus did until now — the language switcher, the footer's language picker and the profile
        menu all opened into a list you could only reach with Tab. Wrapping, because a menu is a
        short ring and running off the bottom of six items to reach the first is nobody's intent.
      */
      onKeyDown={(event) => {
        handleListArrowNavigation(event, { selector: MENU_ITEM_SELECTOR, wrap: true })
        onKeyDown?.(event)
      }}
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
    <button {...props} type={type} className={dropdownMenuItemClassName(active, className)}>
      {children}
    </button>
  )
}
