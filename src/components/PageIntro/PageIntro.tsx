import type { ReactNode } from 'react'

import './PageIntro.css'

type PageIntroProps = {
  eyebrow?: string
  title?: string
  description?: string
  actions?: ReactNode
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: PageIntroProps) {
  return (
    <section className="page-intro">
      <div className="page-intro-copy">
        {eyebrow ? <p className="page-intro-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        <p className="page-intro-description">{description}</p>
      </div>
      {actions ? <div className="page-intro-actions">{actions}</div> : null}
    </section>
  )
}
