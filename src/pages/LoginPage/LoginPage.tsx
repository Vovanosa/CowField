import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { translateAuthMessage } from '../../app/translateAuthMessage'
import { useAuth } from '../../app/useAuth'
import { AuthLayout, type AuthMessage } from '../../components/AuthLayout'
import { AuthPasswordField } from '../../components/AuthPasswordField/AuthPasswordField'
import { GoogleButton } from '../../components/GoogleButton'
import { Button, Field, Input, TextLink } from '../../components/ui'
import { loginWithGoogle, resendVerificationEmail } from '../../game/storage/authSessionStorage'
import styles from '../AuthPage/AuthPage.module.css'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<AuthMessage | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function toErrorMessage(error: unknown): AuthMessage {
    return {
      text: error instanceof Error ? translateAuthMessage(t, error.message) : t('Request failed.'),
      tone: 'error',
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    setNeedsVerification(false)

    try {
      await auth.login(email, password)
      navigate('/', { replace: true })
    } catch (error) {
      setNeedsVerification(error instanceof Error && error.message === 'Email not verified')
      setMessage(toErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGuestLogin() {
    setIsSubmitting(true)
    setMessage(null)
    setNeedsVerification(false)

    try {
      await auth.loginAsGuest()
      navigate('/', { replace: true })
    } catch (error) {
      setMessage(toErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Google sign-in leaves the page on success — it hands the browser to the provider — so anything
   * that comes back here is a failure. It used to be called as a bare `void loginWithGoogle()`: the
   * rejection went nowhere, nothing was shown, and the button simply looked dead.
   */
  async function handleGoogleLogin() {
    setIsSubmitting(true)
    setMessage(null)

    try {
      await loginWithGoogle()
    } catch (error) {
      setMessage(toErrorMessage(error))
      setIsSubmitting(false)
    }
  }

  async function handleResendVerification() {
    setIsSubmitting(true)
    setMessage(null)

    try {
      await resendVerificationEmail(email)
      setMessage({ text: t('Verification email sent again.'), tone: 'success' })
      setNeedsVerification(false)
    } catch (error) {
      setMessage(toErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const routeError = searchParams.get('error') ?? ''
  // `/verify-email` sends the player here with this when the link had nothing left to spend: the
  // address is confirmed, there is just no session to hand over. It was being set and never read.
  const isVerified = searchParams.get('verified') === '1'
  const routeMessage: AuthMessage | null = routeError
    ? { text: translateAuthMessage(t, routeError), tone: 'error' }
    : isVerified
      ? { text: t('Your email is verified. You can log in now.'), tone: 'success' }
      : null
  const visibleMessage = message ?? routeMessage

  return (
    <AuthLayout
      eyebrow={t('Login')}
      title={t('Bullpen')}
      description={t('Sign in with your email and password, create an account, or continue as a guest.')}
      message={visibleMessage}
      links={
        <>
          <TextLink to="/register">
            {t('Create account')}
          </TextLink>
          <TextLink to="/forgot-password">
            {t('Forgot password?')}
          </TextLink>
          {needsVerification ? (
            <Button
              onClick={() => void handleResendVerification()}
              variant="ghost"
              disabled={isSubmitting || email.trim().length === 0}
            >
              {t('Resend verification email')}
            </Button>
          ) : null}
        </>
      }
    >
        <form className={styles.authForm} onSubmit={handleSubmit} autoComplete="on">
          <Field label={t('Email')}>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              name="email"
              inputMode="email"
              required
            />
          </Field>

          <AuthPasswordField
            label={t('Password')}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            name="password"
          />

          <div className={styles.authActions}>
            <Button type="submit" variant="primary" className={styles.authButton} fullWidth disabled={isSubmitting}>
              {isSubmitting ? t('Loading...') : t('Log in')}
            </Button>
            <GoogleButton onClick={() => void handleGoogleLogin()} disabled={isSubmitting} />
            <Button
              onClick={() => void handleGuestLogin()}
              className={styles.authButton}
              fullWidth
              disabled={isSubmitting}
            >
              {t('Play as guest')}
            </Button>
          </div>
        </form>
    </AuthLayout>
  )
}
