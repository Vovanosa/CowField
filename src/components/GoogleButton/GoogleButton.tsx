import { useTranslation } from 'react-i18next'

import { GoogleIcon } from '../icons'
import { Button } from '../ui'
import styles from './GoogleButton.module.css'

type GoogleButtonProps = {
  onClick: () => void
  disabled?: boolean
}

export function GoogleButton({ onClick, disabled = false }: GoogleButtonProps) {
  const { t } = useTranslation()

  return (
    <Button
      type="button"
      variant="secondary"
      fullWidth
      className={styles.button}
      onClick={onClick}
      disabled={disabled}
      leadingIcon={<GoogleIcon />}
    >
      <span className={styles.label}>{t('Continue with Google')}</span>
    </Button>
  )
}
