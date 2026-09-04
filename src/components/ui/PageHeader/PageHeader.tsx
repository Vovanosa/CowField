import { ArrowLeft } from 'lucide-react'

import { IconButton } from '../IconButton'
import styles from './PageHeader.module.css'

/**
 * No `actions` slot on purpose. It used to exist, was never used by any page, and rendered flush
 * right in the same band as the floating language/theme pills — measured overlapping them at every
 * width from 769px to 1440px. If a page ever needs header actions, the top-right of the frame is
 * taken; put them somewhere else or reserve space for them first.
 */
type PageHeaderProps = {
  backTo?: string
  backLabel?: string
  eyebrow?: string
  title?: string
  description?: string
  className?: string
}

export function PageHeader({
  backTo,
  backLabel,
  eyebrow,
  title,
  description,
  className,
}: PageHeaderProps) {
  return (
    <div className={[styles.header, className ?? ''].filter(Boolean).join(' ')}>
      {backTo && backLabel ? (
        <IconButton to={backTo} label={backLabel} icon={<ArrowLeft size={16} />} />
      ) : null}
      <div className={styles.intro}>
        <section className={styles.pageIntro}>
          <div className={styles.pageIntroCopy}>
            {eyebrow ? <p className={styles.pageIntroEyebrow}>{eyebrow}</p> : null}
            {title ? <h2>{title}</h2> : null}
            {description ? <p className={styles.pageIntroDescription}>{description}</p> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
