const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL?.trim()

type TokenResponse = {
  token?: string
  access_token?: string
  session?: {
    token?: string
    access_token?: string
  } | null
}

type SessionResponse = {
  session?: {
    token?: string
  } | null
}

function requireNeonAuthUrl() {
  if (!NEON_AUTH_URL) {
    throw new Error('Neon Auth is not configured.')
  }

  return NEON_AUTH_URL
}

async function parseErrorResponse(response: Response) {
  const responseText = await response.text()

  if (!responseText) {
    return `HTTP ${response.status}`
  }

  try {
    const payload = JSON.parse(responseText) as {
      message?: string
      error?: string
      code?: string
    }

    return payload.message ?? payload.error ?? payload.code ?? `HTTP ${response.status}`
  } catch {
    return responseText
  }
}

export async function getRelayNeonToken(sessionVerifier: string) {
  const neonAuthUrl = requireNeonAuthUrl()

  const tokenResponse = await fetch(
    `${neonAuthUrl}/token?neon_auth_session_verifier=${encodeURIComponent(sessionVerifier)}`,
    {
      credentials: 'include',
    },
  )

  if (tokenResponse.ok) {
    const tokenPayload = (await tokenResponse.json()) as TokenResponse

    const token =
      tokenPayload.token ??
      tokenPayload.access_token ??
      tokenPayload.session?.token ??
      tokenPayload.session?.access_token

    if (typeof token === 'string' && token.length > 0) {
      return token
    }
  }

  const tokenErrorMessage = await parseErrorResponse(tokenResponse)

  const sessionResponse = await fetch(
    `${neonAuthUrl}/get-session?neon_auth_session_verifier=${encodeURIComponent(sessionVerifier)}`,
    {
      credentials: 'include',
    },
  )

  if (!sessionResponse.ok) {
    const sessionErrorMessage = await parseErrorResponse(sessionResponse)
    throw new Error(
      `token endpoint: ${tokenErrorMessage}; get-session endpoint: ${sessionErrorMessage}`,
    )
  }

  const sessionPayload = (await sessionResponse.json()) as SessionResponse
  const token = sessionPayload.session?.token

  if (!token) {
    throw new Error('Relay completed Google login but no Neon JWT token was available.')
  }

  return token
}
