import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { useAuth } from '../../app/useAuth'
import { AuthLayout } from '../../components/AuthLayout'

/**
 * Where the link in a verification email lands.
 *
 * This route is what registration has been pointing at all along — `resendVerificationEmail` sends
 * the address to `/verify-email` — and it did not exist. Every player who followed the link from
 * their inbox hit the router's catch-all and was bounced to `/login` with no explanation, no
 * indication the address had been verified, and no session, so the obvious next move was to type
 * the password again.
 *
 * The provider hands back the same one-shot code an OAuth callback does, so verifying is a
 * sign-in: spend the code and the player arrives already signed in. The one case that lands back at
 * `/login` is a link with nothing to spend, and that carries `?verified=1` so the login page can at
 * least say the address is confirmed.
 */
export function VerifyEmailPage() {
  const { t } = useTranslation()
  useDocumentMeta({ title: brandedTitle(t('Verifying your email...')), robots: 'noindex' })
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { completeEmailVerification, isAuthenticated, isLoading } = useAuth()

  const hasStartedRef = useRef(false)

  useEffect(() => {
    // Wait for the provider to settle before deciding anything.
    if (isLoading) {
      return
    }

    // Already signed in — the link has done its job, and re-running the exchange would fail on a
    // spent code and report an error over a verification that succeeded.
    if (isAuthenticated) {
      navigate('/', { replace: true })
      return
    }

    // The code is one-shot, so a second pass would find nothing and report a failure.
    if (hasStartedRef.current) {
      return
    }

    hasStartedRef.current = true

    const code = searchParams.get('code')
    const error = searchParams.get('error_description') ?? searchParams.get('error')

    async function finishVerification() {
      if (error) {
        /*
          A **key**, not the provider's sentence, and not a translation of it.

          `error` here came out of the address bar, so translating it and forwarding the result was
          wrong twice over: `/login` allowlists `?error=` against the English keys, so an already
          translated string never matches and degrades to the generic message anyway — and a link
          could put any prose it liked into the app's own error styling next to a password field.
          The same fix the Google callback got.
        */
        navigate('/login?error=Email verification failed.', { replace: true })
        return
      }

      if (!code) {
        // Nothing to exchange: an already-spent link, or someone opening the address directly. The
        // address may well be verified, so send them to log in rather than to an error.
        navigate('/login?verified=1', { replace: true })
        return
      }

      try {
        await completeEmailVerification(code)
        navigate('/', { replace: true })
      } catch (verificationError) {
        console.warn('Email verification failed:', verificationError)

        // The key, again: `/login` does the translating, and it only renders a message it ships a
        // string for. Anything else — including an internal error — becomes the generic line there.
        const key =
          verificationError instanceof Error
            ? verificationError.message
            : 'Email verification failed.'
        navigate(`/login?error=${encodeURIComponent(key)}`, { replace: true })
      }
    }

    void finishVerification()
  }, [completeEmailVerification, isAuthenticated, isLoading, navigate, searchParams])

  return (
    <AuthLayout
      eyebrow={t('Login')}
      title={t('CowField')}
      description={t('Verifying your email...')}
    >
      <></>
    </AuthLayout>
  )
}
