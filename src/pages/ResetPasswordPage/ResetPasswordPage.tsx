import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

import { AuthPasswordField } from '../../components/AuthPasswordField/AuthPasswordField'
import { resetPassword } from '../../game/storage'
import styles from '../AuthPage/AuthPage.module.css'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setMessage(t('Passwords do not match.'))
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      await resetPassword(token, password)
      setMessage(t('Your password has been updated.'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('Request failed.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <section className={`${styles.authPanel} panel-surface`}>
        <div className={styles.authHeader}>
          <p className={styles.authEyebrow}>{t('Reset password')}</p>
          <h1 className={styles.authTitle}>{t('Bullpen')}</h1>
          <p className={styles.authDescription}>
            {t('Open the reset link from your email and choose a new password.')}
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit} autoComplete="on">
          <label className={styles.authField}>
            <span>{t('Reset token')}</span>
            <input
              className="form-control"
              type="text"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="one-time-code"
              name="reset-token"
              required
            />
          </label>
          <AuthPasswordField
            label={t('New password')}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            name="new-password"
            minLength={8}
          />
          <AuthPasswordField
            label={t('Confirm password')}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            name="confirm-password"
            minLength={8}
          />

          <button type="submit" className={`primary-button ${styles.authButton}`} disabled={isSubmitting}>
            {isSubmitting ? t('Loading...') : t('Save new password')}
          </button>
        </form>

        <p className={styles.authMessage}>{message}</p>

        <div className={styles.authLinks}>
          <Link className="text-link" to="/login">
            {t('Back to login')}
          </Link>
        </div>
      </section>
    </div>
  )
}
