import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Field, Input } from '../ui'
import styles from './AuthPasswordField.module.css'

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
    <Field label={label} htmlFor={inputId}>
      <div className={styles.passwordField}>
        <Input
          id={inputId}
          className={styles.passwordInput}
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
    </Field>
  )
}
