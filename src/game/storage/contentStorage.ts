export type AppContentKey = 'home' | 'about' | 'settings'

type ContentApiRecord = {
  key: AppContentKey
  text: string
  updatedAt: string
}

const CONTENT_API_BASE = '/api/content'

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CONTENT_API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })

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

  return (await response.json()) as T
}

export async function getContentByKey(key: AppContentKey) {
  return requestJson<ContentApiRecord>(`/${key}`)
}

export async function saveContentByKey(key: AppContentKey, text: string) {
  return requestJson<ContentApiRecord>(`/${key}`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}
