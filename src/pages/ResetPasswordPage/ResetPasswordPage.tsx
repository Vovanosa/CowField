import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { translateAuthError } from '../../app/translateAuthMessage'
import { AuthLayout, type AuthMessage } from '../../components/AuthLayout'
import { AuthPasswordField } from '../../components/AuthPasswordField/AuthPasswordField'
import { Button, Field, Input, TextLink } from '../../components/ui'
import { resetPassword } from '../../game/storage/authSessionStorage'
import styles from '../AuthPage/AuthPage.module.css'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  useDocumentMeta({ title: brandedTitle(t('Reset password')), robots: 'noindex' })
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<AuthMessage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setMessage({ text: t('Passwords do not match.'), tone: 'error' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      await resetPassword(token, password)
      setMessage({ text: t('Your password has been updated.'), tone: 'success' })
    } catch (error) {
      setMessage({
        text: translateAuthError(t, error, t("Couldn't update your password. Try again.")),
        tone: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title={t('CowField')}
      description={t('Open the reset link from your email and choose a new password.')}
      message={message}
      links={
        <TextLink to="/login">
          {t('Back to login')}
        </TextLink>
      }
    >
        <form className={styles.authForm} onSubmit={handleSubmit} autoComplete="on">
          <Field label={t('Reset token')}>
            <Input
              type="text"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="one-time-code"
              name="reset-token"
              required
            />
          </Field>
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

          <Button type="submit" variant="primary" className={styles.authButton} fullWidth disabled={isSubmitting}>
            {isSubmitting ? t('Loading...') : t('Save new password')}
          </Button>
        </form>
    </AuthLayout>
  )
}
