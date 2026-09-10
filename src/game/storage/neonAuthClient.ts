import { getNeonAuthUrl } from './http/apiBase'

const NEON_AUTH_URL = getNeonAuthUrl()

/**
 * The Neon Auth SDK is loaded **on demand**, not at boot.
 *
 * It is `@neondatabase/neon-js` plus its Supabase-compatible adapter, and it measured **365 KB
 * minified** — more than half of the entire first load, and by far the largest single thing in the
 * bundle. Importing it at module top level put it in the entry graph, so *every* visitor downloaded
 * it before the page could paint, including the two who never need it:
 *
 *  - someone reading the landing page, who has no session at all;
 *  - a **guest**, whose token comes from our own `POST /api/auth/guest` and who never talks to Neon.
 *
 * Nothing is lost for a signed-in player: they need the SDK, so they wait for it once, and
 * `getCurrentSession` short-circuits before reaching here when there is no stored role — which is
 * also why a crawler never pays for it.
 */
async function createNeonAuthClient(authUrl: string) {
  const [{ createAuthClient }, { SupabaseAuthAdapter }] = await Promise.all([
    import('@neondatabase/neon-js/auth'),
    import('@neondatabase/neon-js/auth/vanilla/adapters'),
  ])

  return createAuthClient(authUrl, { adapter: SupabaseAuthAdapter() })
}

/**
 * Inferred from the real construction above rather than written out.
 *
 * `createAuthClient` is generic over its adapter, so naming the type as
 * `ReturnType<typeof createAuthClient>` collapses it to a union of every adapter shape and loses
 * every Supabase-specific method — `signInWithPassword`, `exchangeCodeForSession` and the rest all
 * stop existing. Deriving it from the call keeps the adapter that was actually passed.
 */
type NeonAuthClient = Awaited<ReturnType<typeof createNeonAuthClient>>

let clientPromise: Promise<NeonAuthClient | null> | null = null

function getNeonAuthClient() {
  if (!NEON_AUTH_URL) {
    return Promise.resolve(null)
  }

  // Memoised on the promise, not the resolved value: two callers arriving together must not each
  // construct a client, and must not each fetch the chunk.
  clientPromise ??= createNeonAuthClient(NEON_AUTH_URL)

  return clientPromise
}

async function requireNeonAuth() {
  const client = await getNeonAuthClient()

  if (!client) {
    throw new Error('Neon Auth is not configured.')
  }

  return client
}

export async function getNeonSession() {
  const client = await getNeonAuthClient()

  if (!client) {
    return null
  }

  const response = await client.getSession()

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data?.session ?? null
}

export async function signInWithNeonPassword(email: string, password: string) {
  const auth = await requireNeonAuth()
  const response = await auth.signInWithPassword({ email, password })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function signUpWithNeonPassword(
  email: string,
  password: string,
  emailRedirectTo: string,
) {
  const auth = await requireNeonAuth()
  // Points the verification link at our own `/verify-email` route, the same place `resend` sends
  // it. Without this the first email used whatever default the provider is configured with, so the
  // two paths to the same mailbox could land the player in two different places.
  const response = await auth.signUp({ email, password, options: { emailRedirectTo } })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function signInWithNeonGoogle(redirectTo: string) {
  const auth = await requireNeonAuth()
  const response = await auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function requestNeonPasswordReset(email: string, redirectTo: string) {
  const auth = await requireNeonAuth()
  const response = await auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function resendNeonSignupVerification(email: string, emailRedirectTo: string) {
  const auth = await requireNeonAuth()
  const response = await auth.resend({
    email,
    type: 'signup',
    options: {
      emailRedirectTo,
    },
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

/**
 * Set a new password from the token in a reset email.
 *
 * **This is the one call that cannot go through the Supabase-shaped surface, because it is not part
 * of it.** The adapter implements Supabase's `AuthClient`, and Supabase's recovery flow is "turn
 * the emailed link into a session, then `updateUser`" — it has no "reset with a token" method at
 * all. This function used to *cast* one into existence, so every submission threw
 * `resetPassword is not a function`, and minification shipped that to the player as
 * **"n is not a function"** underneath the form. The cast is why it compiled: it asserted the
 * method rather than asking for it.
 *
 * Neon Auth is better-auth underneath, `getBetterAuthInstance()` is a public method on the adapter,
 * and better-auth's `resetPassword` is the endpoint the emailed `?token=` was actually minted for.
 * Going through it is fully typed, so the next wrong method name is a compile error instead of a
 * live one. Measured against the installed SDK on 2026-09-10: `typeof client.resetPassword` is
 * `'undefined'`, `typeof client.getBetterAuthInstance().resetPassword` is `'function'`.
 */
export async function resetNeonPassword(token: string, newPassword: string) {
  const auth = await requireNeonAuth()
  const response = await auth.getBetterAuthInstance().resetPassword({ token, newPassword })

  if (response.error) {
    // Raw provider text, exactly like every other function here: `locales/en.ts` carries keys for
    // the messages worth naming ("Invalid token", "Password too short") and the page falls back to
    // a generic line for anything else, rather than rendering whatever the server happened to say.
    // `message` is optional in better-auth's error shape, hence the fallback.
    throw new Error(response.error.message || "Couldn't update your password. Try again.")
  }

  return response.data
}

export async function exchangeNeonCodeForSession(code: string) {
  const auth = await requireNeonAuth()
  const response = await auth.exchangeCodeForSession(code)

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data
}

export async function signOutNeon() {
  const client = await getNeonAuthClient()

  if (!client) {
    return
  }

  const response = await client.signOut()

  if (response.error) {
    throw new Error(response.error.message)
  }
}
