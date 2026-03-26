import type { PlayerStatisticsSummary } from '../types'
import { buildAuthenticatedHeaders } from './authSessionStorage'
import { buildApiUrl } from './apiBase'

const API_BASE = buildApiUrl('/api/statistics')

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...buildAuthenticatedHeaders(),
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

export async function getPlayerStatistics() {
  return requestJson<PlayerStatisticsSummary>('/')
}

export async function recordBullPlacements(count: number, keepalive = false) {
  if (count <= 0) {
    return { totalBullPlacements: 0 }
  }

  return requestJson<{ totalBullPlacements: number }>('/bull-placement', {
    method: 'POST',
    keepalive,
    body: JSON.stringify({ count }),
  })
}
