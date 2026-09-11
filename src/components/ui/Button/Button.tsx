import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LinkProps } from 'react-router-dom'

import { Link } from '../../../app/navigation'
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
  /**
   * Below 640px, show only the icon. The label stays in the DOM and is merely taken out of the
   * visual flow, so the button's accessible name is unchanged and no `aria-label` is needed. For
   * buttons in a crowded bar — five content-sized pills cannot share a 246px row.
   */
  collapseLabelOnNarrow?: boolean
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
  variant,
  size,
  fullWidth,
  iconOnly,
  collapseLabelOnNarrow,
  className,
  disabled = false,
}: {
  variant: ButtonVariant
  size: ButtonSize
  fullWidth: boolean
  iconOnly: boolean
  collapseLabelOnNarrow: boolean
  className?: string
  disabled?: boolean
}) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    iconOnly ? styles.iconOnly : '',
    collapseLabelOnNarrow ? styles.collapseLabel : '',
    disabled ? styles.buttonDisabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Wrapped so CSS can target the label on its own — a bare text node cannot be hidden. Icon-only
 * buttons pass `{null}`, which gets no wrapper at all.
 */
function renderLabel(children: ReactNode) {
  if (children === null || children === undefined || children === false || children === '') {
    return null
  }

  return <span className={styles.label}>{children}</span>
}

export function Button(props: ButtonProps) {
  // Each branch destructures the presentational props *with* a rest element, so only genuine
  // DOM/link attributes are spread onto the element. Reading them without a rest, as this used to,
  // left `variant`, `iconOnly`, `leadingIcon` and friends in the spread and passed them straight
  // through to the underlying `<a>`/`<button>`.
  if ('to' in props) {
    const {
      to,
      children,
      variant = 'secondary',
      size = 'md',
      leadingIcon,
      trailingIcon,
      fullWidth = false,
      iconOnly = false,
      collapseLabelOnNarrow = false,
      className,
      ...linkProps
    } = props as ButtonAsLinkProps

    return (
      <Link
        {...linkProps}
        to={to}
        className={getButtonClassName({
          variant,
          size,
          fullWidth,
          iconOnly,
          collapseLabelOnNarrow,
          className,
        })}
      >
        {leadingIcon}
        {renderLabel(children)}
        {trailingIcon}
      </Link>
    )
  }

  const {
    children,
    variant = 'secondary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    iconOnly = false,
    collapseLabelOnNarrow = false,
    className,
    type = 'button',
    disabled = false,
    ...buttonProps
  } = props as ButtonAsButtonProps

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
        collapseLabelOnNarrow,
        className,
        disabled,
      })}
    >
      {leadingIcon}
      {renderLabel(children)}
      {trailingIcon}
    </button>
  )
}
