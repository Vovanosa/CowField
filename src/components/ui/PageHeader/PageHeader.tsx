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
  /**
   * The heading level for `title`. `h2` by default, which is what every page used before there was
   * a public page at all.
   *
   * A document should have exactly one `h1`, and on an indexable page that heading is the strongest
   * on-page signal of what the page is about — `/about` was measured with **no `h1` at all**. The
   * private pages keep `h2`; there is no crawler to tell, and changing them all is a separate
   * accessibility pass.
   *
   * Only the tag changes: `.pageIntroTitle` pins the size, so an `h1` here does not inherit the
   * 4.4rem wordmark styling `h1` carries globally.
   */
  titleAs?: 'h1' | 'h2'
}

export function PageHeader({
  backTo,
  backLabel,
  eyebrow,
  title,
  description,
  className,
  titleAs: TitleTag = 'h2',
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
            {title ? <TitleTag className={styles.pageIntroTitle}>{title}</TitleTag> : null}
            {description ? <p className={styles.pageIntroDescription}>{description}</p> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
