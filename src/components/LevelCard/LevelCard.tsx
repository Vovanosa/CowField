import { Plus, SquarePen } from 'lucide-react'

import { Link } from '../../app/navigation'
import { Panel } from '../ui'
import styles from './LevelCard.module.css'

type PlayLevelCardProps = {
  levelNumber: number
  bestTime?: string | null
  openTo?: string
  openLabel?: string
  editTo?: string
  editLabel?: string
}

type CreateLevelCardProps = {
  createTo: string
  createLabel: string
}

export type LevelCardProps = PlayLevelCardProps | CreateLevelCardProps

function isCreateCard(props: LevelCardProps): props is CreateLevelCardProps {
  return 'createTo' in props
}

export function LevelCard(props: LevelCardProps) {
  if (isCreateCard(props)) {
    return (
      <Panel as={Link} to={props.createTo} className={`${styles.card} ${styles.createCard} ${styles.clickable}`}>
        <Plus size={42} strokeWidth={2.2} aria-label={props.createLabel} />
      </Panel>
    )
  }

  const { levelNumber, bestTime, openTo, openLabel, editTo, editLabel } = props

  return (
    <Panel as="article" className={`${styles.card} ${styles.clickable}`}>
      {openTo && openLabel ? (
        <Link className={styles.linkOverlay} to={openTo} aria-label={openLabel} />
      ) : null}

      <div className={styles.summary}>
        <span className={styles.number}>{levelNumber}</span>
        {bestTime ? <span className={styles.time}>{bestTime}</span> : null}
      </div>

      {editTo && editLabel ? (
        <div className={styles.actions}>
          <Link className={styles.editLink} to={editTo} aria-label={editLabel}>
            <SquarePen size={16} />
          </Link>
        </div>
      ) : null}
    </Panel>
  )
}
