import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { exchangeNeonCodeForSession } from '../../game/storage/neonAuthClient'
import { getRelayNeonToken } from '../../game/storage/neonAuthRelayClient'

export function MobileGoogleRelayPage() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    function delay(ms: number) {
      return new Promise((resolve) => window.setTimeout(resolve, ms))
    }

    async function getNeonTokenWithRetry(sessionVerifier: string) {
      const retryDelays = [0, 150, 400, 900, 1600]
      let lastError: unknown = null

      for (const retryDelay of retryDelays) {
        if (retryDelay > 0) {
          await delay(retryDelay)
        }

        try {
          const token = await getRelayNeonToken(sessionVerifier)

          if (token) {
            return token
          }
        } catch (error) {
          lastError = error
        }
      }

      if (lastError instanceof Error) {
        throw lastError
      }

      throw new Error('Relay completed Google login but no Neon JWT token was available.')
    }

    async function finishMobileGoogleLogin() {
      const appRedirect = searchParams.get('appRedirect')
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const sessionVerifier = searchParams.get('neon_auth_session_verifier')

      if (!appRedirect) {
        return
      }

      const redirectUrl = new URL(appRedirect)

      if (error) {
        redirectUrl.searchParams.set('error', error)
        window.location.replace(redirectUrl.toString())
        return
      }

      try {
        if (code) {
          await exchangeNeonCodeForSession(code)
        }

        if (!code && !sessionVerifier) {
          throw new Error('Missing Google OAuth verifier.')
        }

        if (!sessionVerifier) {
          throw new Error('Missing Google session verifier.')
        }

        const token = await getNeonTokenWithRetry(sessionVerifier)

        redirectUrl.searchParams.set('token', token)
        window.location.replace(redirectUrl.toString())
      } catch (completionError) {
        redirectUrl.searchParams.set(
          'error',
          completionError instanceof Error
            ? `Mobile Google relay failed: ${completionError.message}`
            : 'Mobile Google relay failed.',
        )
        window.location.replace(redirectUrl.toString())
      }
    }

    void finishMobileGoogleLogin()
  }, [searchParams])

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Completing Google login for the Android app...
    </div>
  )
}
