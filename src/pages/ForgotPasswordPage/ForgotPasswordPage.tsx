import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { translateAuthMessage } from '../../app/translateAuthMessage'
import { AuthLayout, type AuthMessage } from '../../components/AuthLayout'
import { Button, Field, Input, TextLink } from '../../components/ui'
import { requestPasswordReset } from '../../game/storage/authSessionStorage'
import styles from '../AuthPage/AuthPage.module.css'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  useDocumentMeta({ title: brandedTitle(t('Forgot password?')), robots: 'noindex' })
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<AuthMessage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      await requestPasswordReset(email)
      setMessage({
        text: t('If the account exists, a reset link has been sent to that email address.'),
        tone: 'success',
      })
    } catch (error) {
      // Previously indistinguishable from the success above: this page passed no tone at all, so a
      // failed request was rendered in the same neutral grey as a sent link.
      setMessage({
        text: error instanceof Error ? translateAuthMessage(t, error.message) : t('Request failed.'),
        tone: 'error',
      })
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
