import type { ReactNode } from 'react'

import './SurfaceCard.css'

type SurfaceCardProps = {
  title: string
  description: string
  icon?: ReactNode
  detail?: ReactNode
  action?: ReactNode
}

export function SurfaceCard({
  title,
  description,
  icon,
  detail,
  action,
}: SurfaceCardProps) {
  return (
    <article className="surface-card panel-surface">
      <div className="surface-card-header">
        {icon ? <div className="surface-card-icon">{icon}</div> : null}
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {detail ? <div className="surface-card-detail">{detail}</div> : null}
      {action ? <div className="surface-card-action">{action}</div> : null}
    </article>
  )
}
