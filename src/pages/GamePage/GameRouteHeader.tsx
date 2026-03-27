import { ArrowLeft } from 'lucide-react'

import { IconButton } from '../../components/ui'
import styles from './GamePage.module.css'

type GameRouteHeaderProps = {
  backTo: string
  backLabel: string
  levelLabel: string
}

export function GameRouteHeader({ backTo, backLabel, levelLabel }: GameRouteHeaderProps) {
  return (
    <div className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <IconButton to={backTo} label={backLabel} icon={<ArrowLeft size={16} />} />
        <p className={styles.topbarTitle}>{levelLabel}</p>
      </div>
    </div>
  )
}
