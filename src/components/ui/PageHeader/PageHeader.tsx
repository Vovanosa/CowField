import type { ReactNode } from 'react'

import { ArrowLeft } from 'lucide-react'

import { IconButton } from '../IconButton'
import styles from './PageHeader.module.css'

type PageHeaderProps = {
  backTo?: string
  backLabel?: string
  eyebrow?: string
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  backTo,
  backLabel,
  eyebrow,
  title,
  description,
  actions,
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
          {actions ? <div className={styles.pageIntroActions}>{actions}</div> : null}
        </section>
      </div>
    </div>
  )
}
