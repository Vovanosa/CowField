import type { LucideIcon } from 'lucide-react'

import { Panel } from '../ui'
import styles from './StatCard.module.css'

type StatCardProps = {
  title: string
  value: string
  icon: LucideIcon
  detail?: string
  inlineDetail?: boolean
}

export function StatCard({
  title,
  value,
  icon: Icon,
  detail,
  inlineDetail = false,
}: StatCardProps) {
  return (
    <Panel as="article" compact className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>
          <Icon size={18} />
        </span>
        <p className={styles.label}>{title}</p>
      </div>

      {inlineDetail && detail ? (
        <div className={styles.inlineValueRow}>
          <strong className={styles.value}>{value}</strong>
          <p className={styles.detail}>{detail}</p>
        </div>
      ) : (
        <>
          <strong className={styles.value}>{value}</strong>
          {detail ? <p className={styles.detail}>{detail}</p> : null}
        </>
      )}
    </Panel>
  )
}
