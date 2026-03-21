import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from '../../pages/AuthPage/AuthPage.module.css'

type AuthPasswordFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  name: string
  minLength?: number
}

export function AuthPasswordField({
  label,
  value,
  onChange,
  autoComplete,
  name,
  minLength,
}: AuthPasswordFieldProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <label className={styles.authField} htmlFor={inputId}>
      <span>{label}</span>
      <div className={styles.passwordField}>
        <input
          id={inputId}
          className={`form-control ${styles.passwordInput}`}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          name={name}
          minLength={minLength}
          required
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? t('Hide password') : t('Show password')}
          aria-pressed={isVisible}
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  )
}
