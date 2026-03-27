import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { translateAuthMessage } from '../../app/translateAuthMessage'
import { useAuth } from '../../app/useAuth'
import { AuthLayout } from '../../components/AuthLayout'
import { AuthPasswordField } from '../../components/AuthPasswordField/AuthPasswordField'
import { GoogleButton } from '../../components/GoogleButton'
import { Button, Field, Input, TextLink } from '../../components/ui'
import { loginWithGoogle } from '../../game/storage/authSessionStorage'
import styles from '../AuthPage/AuthPage.module.css'

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
      if (error instanceof Error && error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        setMessage(t('Account created. Check your email to verify it before logging in.'))
      } else {
        setMessage(
          error instanceof Error
            ? translateAuthMessage(t, error.message)
            : t('Request failed.'),
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={t('Create account')}
      title={t('Bullpen')}
      description={t('Create a user account with your email and password.')}
      message={message}
      isErrorMessage={Boolean(message)}
      links={
        <TextLink to="/login">
          {t('Back to login')}
        </TextLink>
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

          <Button type="submit" variant="primary" className={styles.authButton} fullWidth disabled={isSubmitting}>
            {isSubmitting ? t('Loading...') : t('Create account')}
          </Button>
          <GoogleButton onClick={() => void loginWithGoogle()} disabled={isSubmitting} />
        </form>
    </AuthLayout>
  )
}
