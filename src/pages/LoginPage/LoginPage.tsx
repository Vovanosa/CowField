import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../../app/useAuth'
import { AuthPasswordField } from '../../components/AuthPasswordField/AuthPasswordField'
import { GoogleMark } from '../../components/GoogleMark/GoogleMark'
import { buildApiUrl } from '../../game/storage/apiBase'
import styles from '../AuthPage/AuthPage.module.css'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const googleLoginUrl = buildApiUrl('/api/auth/google')
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      await auth.login(email, password)
      navigate('/', { replace: true })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('Request failed.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGuestLogin() {
    setIsSubmitting(true)
    setMessage('')

    try {
      await auth.loginAsGuest()
      navigate('/', { replace: true })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('Request failed.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const routeError = searchParams.get('error') ?? ''
  const visibleMessage = message || routeError

  return (
    <div className={styles.authPage}>
      <section className={`${styles.authPanel} panel-surface`}>
        <div className={styles.authHeader}>
          <p className={styles.authEyebrow}>{t('Login')}</p>
          <h1 className={styles.authTitle}>{t('Bullpen')}</h1>
          <p className={styles.authDescription}>
            {t('Sign in with your email and password, create an account, or continue as a guest.')}
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
            autoComplete="current-password"
            name="password"
          />

          <div className={styles.authActions}>
            <button type="submit" className={`primary-button ${styles.authButton}`} disabled={isSubmitting}>
              {isSubmitting ? t('Loading...') : t('Log in')}
            </button>
            <a href={googleLoginUrl} className={styles.googleButton}>
              <GoogleMark />
              <span className={styles.googleButtonLabel}>{t('Continue with Google')}</span>
            </a>
            <button
              type="button"
              className={`secondary-button ${styles.authButton}`}
              onClick={() => void handleGuestLogin()}
              disabled={isSubmitting}
            >
              {t('Play as guest')}
            </button>
          </div>
        </form>

        <p className={visibleMessage ? `${styles.authMessage} ${styles.authMessageError}` : styles.authMessage}>
          {visibleMessage}
        </p>

        <div className={styles.authLinks}>
          <Link className="text-link" to="/register">
            {t('Create account')}
          </Link>
          <Link className="text-link" to="/forgot-password">
            {t('Forgot password?')}
          </Link>
        </div>
      </section>
    </div>
  )
}
