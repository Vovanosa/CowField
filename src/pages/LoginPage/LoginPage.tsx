import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { translateAuthMessage } from '../../app/translateAuthMessage'
import { useAuth } from '../../app/useAuth'
import { AuthLayout } from '../../components/AuthLayout'
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
  const [message, setMessage] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    setNeedsVerification(false)

    try {
      await auth.login(email, password)
      navigate('/', { replace: true })
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : t('Request failed.')
      setNeedsVerification(nextMessage === 'Email not verified')
      setMessage(translateAuthMessage(t, nextMessage))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGuestLogin() {
    setIsSubmitting(true)
    setMessage('')
    setNeedsVerification(false)

    try {
      await auth.loginAsGuest()
      navigate('/', { replace: true })
    } catch (error) {
      setMessage(
        error instanceof Error
          ? translateAuthMessage(t, error.message)
          : t('Request failed.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResendVerification() {
    setIsSubmitting(true)
    setMessage('')

    try {
      await resendVerificationEmail(email)
      setMessage(t('Verification email sent again.'))
      setNeedsVerification(false)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? translateAuthMessage(t, error.message)
          : t('Request failed.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const routeError = searchParams.get('error') ?? ''
  const visibleMessage = message || (routeError ? translateAuthMessage(t, routeError) : '')

  return (
    <AuthLayout
      eyebrow={t('Login')}
      title={t('Bullpen')}
      description={t('Sign in with your email and password, create an account, or continue as a guest.')}
      message={visibleMessage}
      isErrorMessage={Boolean(visibleMessage)}
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
            <GoogleButton onClick={() => void loginWithGoogle()} disabled={isSubmitting} />
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
