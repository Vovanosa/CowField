import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { translateAuthMessage } from '../../app/translateAuthMessage'
import { AuthLayout } from '../../components/AuthLayout'
import { Button, Field, Input, TextLink } from '../../components/ui'
import { requestPasswordReset } from '../../game/storage/authSessionStorage'
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
      description={t('Enter your email and we will send you a password reset link.')}
      message={message}
      links={
        <>
          <TextLink to="/reset-password">
            {t('I already have a reset link')}
          </TextLink>
          <TextLink to="/login">
            {t('Back to login')}
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

          <Button type="submit" variant="primary" className={styles.authButton} fullWidth disabled={isSubmitting}>
            {isSubmitting ? t('Loading...') : t('Send reset link')}
          </Button>
        </form>
    </AuthLayout>
  )
}
