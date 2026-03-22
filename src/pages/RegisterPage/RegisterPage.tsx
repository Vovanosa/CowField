import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../app/useAuth'
import { AuthPasswordField } from '../../components/AuthPasswordField/AuthPasswordField'
import { GoogleMark } from '../../components/GoogleMark/GoogleMark'
import { buildApiUrl } from '../../game/storage/apiBase'
import styles from '../AuthPage/AuthPage.module.css'

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const googleLoginUrl = buildApiUrl('/api/auth/google')
  const auth = useAuth()
  const [email, setEmail] = useState('')
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
      await auth.register(email, password)
      navigate('/', { replace: true })
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
          <p className={styles.authEyebrow}>{t('Create account')}</p>
          <h1 className={styles.authTitle}>{t('Bullpen')}</h1>
          <p className={styles.authDescription}>
            {t('Create a user account with your email and password.')}
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

          <AuthPasswordField
            label={t('Password')}
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
            {isSubmitting ? t('Loading...') : t('Create account')}
          </button>
          <a href={googleLoginUrl} className={styles.googleButton}>
            <GoogleMark />
            <span className={styles.googleButtonLabel}>{t('Continue with Google')}</span>
          </a>
        </form>

        <p className={message ? `${styles.authMessage} ${styles.authMessageError}` : styles.authMessage}>
          {message}
        </p>

        <div className={styles.authLinks}>
          <Link className="text-link" to="/login">
            {t('Back to login')}
          </Link>
        </div>
      </section>
    </div>
  )
}
