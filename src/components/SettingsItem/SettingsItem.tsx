import { Switch } from '../ui'
import type { LucideIcon } from 'lucide-react'

import styles from './SettingsItem.module.css'

type SettingsItemProps = {
  icon: LucideIcon
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onToggle: () => void
  volume?: number
  volumeLabel?: string
  onVolumeChange?: (value: number) => void
  showDivider?: boolean
}

export function SettingsItem({
  icon: Icon,
  title,
  description,
  checked,
  disabled = false,
  onToggle,
  volume,
  volumeLabel,
  onVolumeChange,
  showDivider = false,
}: SettingsItemProps) {
  return (
    <article className={[styles.settingCard, showDivider ? styles.withDivider : ''].filter(Boolean).join(' ')}>
      <div className={styles.settingMainRow}>
        <div className={styles.settingInfo}>
          <span className={styles.settingIcon}>
            <Icon size={18} />
          </span>
          <div className={styles.settingCopy}>
            <h2 className={styles.settingTitle}>{title}</h2>
            <p className={styles.settingDescription}>{description}</p>
          </div>
        </div>

        <Switch checked={checked} onClick={onToggle} disabled={disabled} />
      </div>

      {typeof volume === 'number' && onVolumeChange ? (
        <div className={styles.sliderRow}>
          <div className={styles.sliderHeader}>
            <p className={styles.sliderLabel}>{volumeLabel}</p>
            <span className={styles.sliderValue}>{volume}%</span>
          </div>
          <input
            className={styles.slider}
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
          />
        </div>
      ) : null}
    </article>
  )
}
