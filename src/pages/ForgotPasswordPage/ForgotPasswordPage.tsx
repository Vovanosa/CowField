import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { requestPasswordReset } from '../../game/storage'
import styles from '../AuthPage/AuthPage.module.css'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      await requestPasswordReset(email)
      setMessage(t('If the account exists, a reset link has been sent to that email address.'))
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
            {t('Enter your email and we will send you a password reset link.')}
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit} autoComplete="on">
          <label className={styles.authField}>
            <span>{t('Email')}</span>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              name="email"
              inputMode="email"
              required
            />
          </label>

          <button type="submit" className={`primary-button ${styles.authButton}`} disabled={isSubmitting}>
            {isSubmitting ? t('Loading...') : t('Send reset link')}
          </button>
        </form>

        <p className={styles.authMessage}>{message}</p>

        <div className={styles.authLinks}>
          <Link className="text-link" to="/reset-password">
            {t('I already have a reset link')}
          </Link>
          <Link className="text-link" to="/login">
            {t('Back to login')}
          </Link>
        </div>
      </section>
    </div>
  )
}
