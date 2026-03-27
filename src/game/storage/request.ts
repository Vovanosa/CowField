import { buildAuthenticatedHeaders } from './authSessionStorage'

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)

  if (!response.ok) {
    let message = 'Request failed.'

    try {
      const payload = (await response.json()) as { message?: string }
      message = payload.message ?? message
    } catch {
      // ignore parse error
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function requestAuthenticatedJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  return requestJson<T>(url, {
    ...init,
    headers: await buildAuthenticatedHeaders(init?.headers),
  })
}
