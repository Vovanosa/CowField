import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { translateAuthMessage } from '../../app/translateAuthMessage'
import { AuthLayout } from '../../components/AuthLayout'
import { AuthPasswordField } from '../../components/AuthPasswordField/AuthPasswordField'
import { Button, Field, Input, TextLink } from '../../components/ui'
import { resetPassword } from '../../game/storage/authSessionStorage'
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
      setMessage(
        error instanceof Error
          ? translateAuthMessage(t, error.message)
          : t('Request failed.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={t('Reset password')}
      title={t('Bullpen')}
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
