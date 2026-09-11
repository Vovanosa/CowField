import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import { useNavigate } from '../../app/navigation'
import { readReturnTo } from '../../app/returnTo'
import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { translateAuthError } from '../../app/translateAuthMessage'
import { useAuth } from '../../app/useAuth'
import { AuthLayout, type AuthMessage } from '../../components/AuthLayout'
import { AuthPasswordField } from '../../components/AuthPasswordField/AuthPasswordField'
import { GoogleButton } from '../../components/GoogleButton'
import { Button, Field, Input, TextLink } from '../../components/ui'
import { loginWithGoogle } from '../../game/storage/authSessionStorage'
import styles from '../AuthPage/AuthPage.module.css'

export function RegisterPage() {
  const { t } = useTranslation()
  useDocumentMeta({ title: brandedTitle(t('Create account')), robots: 'noindex' })
  const navigate = useNavigate()
  // Where the reader came from, when they got here through the level gate. `null` for anyone who
  // arrived at `/register` directly, which is still the common case.
  const returnTo = readReturnTo(useLocation().search)
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<AuthMessage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function toErrorMessage(error: unknown): AuthMessage {
    return {
      text: translateAuthError(t, error, t("Couldn't create your account. Try again.")),
      tone: 'error',
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setMessage({ text: t('Passwords do not match.'), tone: 'error' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      await auth.register(email, password)
      navigate(returnTo ?? '/', { replace: true })
    } catch (error) {
      if (error instanceof Error && error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        // The account exists and the email is on its way — the opposite of a failure, and it used
        // to be styled in the error colour because any message at all was treated as one.
        setMessage({
          text: t('Account created. Check your email to verify it before logging in.'),
          tone: 'success',
        })
      } else {
        setMessage(toErrorMessage(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  /** See `LoginPage.handleGoogleLogin` — success navigates away, so a return here is a failure. */
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

  return (
    <AuthLayout
      title={t('CowField')}
      description={t('Create a user account with your email and password.')}
      message={message}
      links={
        <>
          <TextLink to="/login">
            {t('Back to login')}
          </TextLink>
          {/* Signed out by definition here, so `/` is the landing page — see the note on `/login`. */}
          <TextLink to="/">
            {t('What is CowField?')}
          </TextLink>
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
          <GoogleButton onClick={() => void handleGoogleLogin()} disabled={isSubmitting} />
        </form>
    </AuthLayout>
  )
}
