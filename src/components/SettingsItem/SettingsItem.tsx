import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Switch } from '../ui'
import styles from './SettingsItem.module.css'

type SettingsItemProps = {
  icon: LucideIcon
  title: string
  description: string
  checked?: boolean
  disabled?: boolean
  onToggle?: () => void
  control?: ReactNode
  controlBelow?: boolean
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
  control,
  controlBelow = false,
  volume,
  volumeLabel,
  onVolumeChange,
  showDivider = false,
}: SettingsItemProps) {
  const inlineControl =
    !controlBelow && (control ?? (typeof checked === 'boolean' && onToggle ? (
      <Switch checked={checked} onClick={onToggle} disabled={disabled} />
    ) : null))

  const belowControl = controlBelow ? control : null

  return (
    <article className={[styles.settingCard, showDivider ? styles.withDivider : ''].filter(Boolean).join(' ')}>
      <div className={styles.settingMainRow}>
        <span className={styles.settingIcon}>
          <Icon size={18} />
        </span>
        <div className={styles.settingContent}>
          <div className={styles.settingTitleRow}>
            <h2 className={styles.settingTitle}>{title}</h2>
            {inlineControl}
          </div>
          <p className={styles.settingDescription}>{description}</p>
        </div>
      </div>

      {belowControl ? <div className={styles.belowControlRow}>{belowControl}</div> : null}

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
