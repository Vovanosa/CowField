import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

import styles from './TextLink.module.css'

type SharedProps = {
  children: ReactNode
  className?: string
}

type TextLinkAsAnchorProps = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    to?: never
  }

type TextLinkAsRouterLinkProps = SharedProps &
  Omit<LinkProps, 'className'> & {
    to: LinkProps['to']
  }

export type TextLinkProps = TextLinkAsAnchorProps | TextLinkAsRouterLinkProps

function getClassName(className?: string) {
  return [styles.link, className ?? ''].filter(Boolean).join(' ')
}

export function TextLink(props: TextLinkProps) {
  const { children, className } = props

  if ('to' in props) {
    const { to, ...linkProps } = props as TextLinkAsRouterLinkProps

    return (
      <Link {...linkProps} to={to} className={getClassName(className)}>
        {children}
      </Link>
    )
  }

  return (
    <a {...(props as TextLinkAsAnchorProps)} className={getClassName(className)}>
      {children}
    </a>
  )
}
