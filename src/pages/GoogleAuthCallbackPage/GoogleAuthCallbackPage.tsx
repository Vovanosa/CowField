import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { useNavigate } from '../../app/navigation'
import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { useAuth } from '../../app/useAuth'
import { AuthLayout } from '../../components/AuthLayout'

export function GoogleAuthCallbackPage() {
  const { t } = useTranslation()
  useDocumentMeta({ title: brandedTitle(t('Login')), robots: 'noindex' })
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { completeGoogleLogin, isAuthenticated, isLoading } = useAuth()

  const hasStartedRef = useRef(false)

  useEffect(() => {
    // Wait for the provider to settle before deciding anything.
    if (isLoading) {
      return
    }

    // Already signed in — nothing to complete, and re-running the flow would fail on a spent
    // verifier and bounce to an error page. Just go home.
    if (isAuthenticated) {
      navigate('/', { replace: true })
      return
    }

    // Run exactly once. The verifier is one-shot, so a second pass would find nothing and report a
    // failure over a login that already succeeded.
    if (hasStartedRef.current) {
      return
    }

    hasStartedRef.current = true

    const code = searchParams.get('code')
    const error = searchParams.get('error')
    // Neon's browser client consumes this itself; we only read it to tell a real callback from a
    // stray visit.
    const sessionVerifier = searchParams.get('neon_auth_session_verifier')

    /**
     * The **key**, never the translated sentence.
     *
     * `/login` allowlists `?error=` against the catalogue now, so prose sent from here would fail
     * that check and show up as the generic failure. Sending the key also stops the message being
     * translated twice — once here and once on arrival — and keeps the URL language-independent, so
     * a player who switches language on the login page sees the right text either way.
     */
    function redirectWithError(messageKey: string) {
      navigate(`/login?error=${encodeURIComponent(messageKey)}`, { replace: true })
    }

    async function finishLogin() {
      if (error) {
        redirectWithError(error)
        return
      }

      if (!code && !sessionVerifier) {
        redirectWithError('Google login failed.')
        return
      }

      try {
        await completeGoogleLogin(code ?? undefined)
        navigate('/', { replace: true })
      } catch (completionError) {
        redirectWithError(
          completionError instanceof Error ? completionError.message : 'Google login failed.',
        )
      }
    }

    void finishLogin()
  }, [completeGoogleLogin, isAuthenticated, isLoading, navigate, searchParams])

  return (
    <AuthLayout
      title={t('CowField')}
      description={t('Completing Google login...')}
    >
      <></>
    </AuthLayout>
  )
}
