import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

type SharedProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  fullWidth?: boolean
  iconOnly?: boolean
  className?: string
}

type ButtonAsButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: never
  }

type ButtonAsLinkProps = SharedProps &
  Omit<LinkProps, 'className'> & {
    to: LinkProps['to']
  }

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps

function getButtonClassName({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
  className,
  disabled = false,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  iconOnly?: boolean
  className?: string
  disabled?: boolean
}) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    iconOnly ? styles.iconOnly : '',
    disabled ? styles.buttonDisabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function Button(props: ButtonProps) {
  const {
    children,
    variant = 'secondary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    iconOnly = false,
    className,
  } = props

  if ('to' in props) {
    const { to, ...linkProps } = props as ButtonAsLinkProps

    return (
      <Link
        {...linkProps}
        to={to}
        className={getButtonClassName({
          variant,
          size,
          fullWidth,
          iconOnly,
          className,
        })}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </Link>
    )
  }

  const { type = 'button', disabled = false, ...buttonProps } = props as ButtonAsButtonProps

  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled}
      className={getButtonClassName({
        variant,
        size,
        fullWidth,
        iconOnly,
        className,
        disabled,
      })}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
}
