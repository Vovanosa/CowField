import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

import styles from './IconButton.module.css'

export type IconButtonVariant = 'secondary' | 'ghost'
export type IconButtonSize = 'sm' | 'md'

type SharedProps = {
  icon: ReactNode
  label: string
  variant?: IconButtonVariant
  size?: IconButtonSize
  className?: string
}

type IconButtonAsButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: never
  }

type IconButtonAsLinkProps = SharedProps &
  Omit<LinkProps, 'className'> & {
    to: LinkProps['to']
  }

export type IconButtonProps = IconButtonAsButtonProps | IconButtonAsLinkProps

function getClassName({
  className,
  disabled = false,
  size = 'md',
  variant = 'secondary',
}: {
  className?: string
  disabled?: boolean
  size?: IconButtonSize
  variant?: IconButtonVariant
}) {
  return [styles.iconButton, styles[size], styles[variant], disabled ? styles.disabled : '', className ?? '']
    .filter(Boolean)
    .join(' ')
}

export function IconButton(props: IconButtonProps) {
  const { icon, label, className, size = 'md', variant = 'secondary' } = props

  if ('to' in props) {
    const { to, ...linkProps } = props as IconButtonAsLinkProps

    return (
      <Link
        {...linkProps}
        to={to}
        aria-label={label}
        className={getClassName({ className, size, variant })}
      >
        {icon}
      </Link>
    )
  }

  const { type = 'button', disabled = false, ...buttonProps } = props as IconButtonAsButtonProps

  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled}
      aria-label={label}
      className={getClassName({ className, disabled, size, variant })}
    >
      {icon}
    </button>
  )
}
