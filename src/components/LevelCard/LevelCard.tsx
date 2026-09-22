import { Check, Plus, SquarePen } from 'lucide-react'

import { Link } from '../../app/navigation'
import { Panel } from '../ui'
import styles from './LevelCard.module.css'

type PlayLevelCardProps = {
  levelNumber: number
  /**
   * Whether this level has been finished — **independent of whether there is a time to show**.
   *
   * These were the same thing until 2026-09-20, because a solved level was drawn only by rendering
   * its `bestTime`. That made completion invisible to exactly the people who cannot have a time:
   * a guest has `take your time` forced on (universal rule 6), so the levels page passed no
   * `bestTime` for anybody and a guest's grid looked untouched however much they had solved. The
   * progress was recorded correctly the whole time and simply never drawn.
   *
   * Now the mark and the time are two separate facts, so the grid reads the same for a guest, for a
   * player with the timer off, and for a player with it on — the last of whom just gets one extra
   * line.
   */
  isSolved?: boolean
  bestTime?: string | null
  solvedLabel?: string
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
      <Panel
        as={Link}
        to={props.createTo}
        /* Arrow navigation on the grid steps between these, so the create card is one of the stops. */
        data-level-link=""
        className={`${styles.card} ${styles.createCard} ${styles.clickable}`}
      >
        <Plus size={42} strokeWidth={2.2} aria-label={props.createLabel} />
      </Panel>
    )
  }

  const { levelNumber, isSolved, bestTime, solvedLabel, openTo, openLabel, editTo, editLabel } =
    props

  return (
    <Panel
      as="article"
      className={`${styles.card} ${styles.clickable}${isSolved ? ` ${styles.solved}` : ''}`}
    >
      {openTo && openLabel ? (
        <Link className={styles.linkOverlay} to={openTo} aria-label={openLabel} data-level-link="" />
      ) : null}

      {/*
        Top **left**, because the admin edit button owns the top right and the two would collide on
        every solved level in the editor. `role="img"` with a label rather than a bare icon: the
        check is the only thing distinguishing a solved card for someone who cannot see the tint, so
        it has to carry the meaning itself.
      */}
      {isSolved ? (
        <span className={styles.solvedBadge} role="img" aria-label={solvedLabel}>
          <Check size={15} strokeWidth={3} aria-hidden="true" />
        </span>
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
