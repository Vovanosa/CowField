import { useTranslation } from 'react-i18next'

import { GoogleIcon } from '../icons'
import styles from './GoogleButton.module.css'

type GoogleButtonProps = {
  onClick: () => void
  disabled?: boolean
}

export function GoogleButton({ onClick, disabled = false }: GoogleButtonProps) {
  const { t } = useTranslation()

  return (
    <button type="button" className={styles.button} onClick={onClick} disabled={disabled}>
      <GoogleIcon />
      <span className={styles.label}>{t('Continue with Google')}</span>
    </button>
  )
}
