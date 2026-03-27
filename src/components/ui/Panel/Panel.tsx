import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import styles from './Panel.module.css'

type PanelProps<T extends ElementType = 'section'> = {
  as?: T
  children: ReactNode
  className?: string
  compact?: boolean
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function Panel<T extends ElementType = 'section'>({
  as,
  children,
  className,
  compact = false,
  ...props
}: PanelProps<T>) {
  const Component = as ?? 'section'
  const resolvedClassName = [styles.panel, compact ? styles.compact : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <Component {...props} className={resolvedClassName}>
      {children}
    </Component>
  )
}
