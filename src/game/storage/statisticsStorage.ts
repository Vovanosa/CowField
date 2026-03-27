import type { PlayerStatisticsSummary } from '../types'
import { buildApiUrl } from './apiBase'
import { requestAuthenticatedJson } from './request'

const API_BASE = buildApiUrl('/api/statistics')
let cachedStatistics: PlayerStatisticsSummary | null = null
let inFlightStatisticsPromise: Promise<PlayerStatisticsSummary> | null = null

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  return requestAuthenticatedJson<T>(`${API_BASE}${path}`, init)
}

export async function getPlayerStatistics() {
  if (cachedStatistics) {
    return {
      ...cachedStatistics,
      byDifficulty: cachedStatistics.byDifficulty.map((item) => ({
        ...item,
        fastestLevel: item.fastestLevel ? { ...item.fastestLevel } : null,
      })),
    }
  }

  if (inFlightStatisticsPromise) {
    return inFlightStatisticsPromise
  }

  inFlightStatisticsPromise = requestJson<PlayerStatisticsSummary>('/')
    .then((statistics) => {
      cachedStatistics = statistics
      inFlightStatisticsPromise = null
      return statistics
    })
    .catch((error) => {
      inFlightStatisticsPromise = null
      throw error
    })

  return inFlightStatisticsPromise
}

export async function recordBullPlacements(count: number, keepalive = false) {
  if (count <= 0) {
    return { totalBullPlacements: 0 }
  }

  const response = await requestJson<{ totalBullPlacements: number }>('/bull-placement', {
    method: 'POST',
    keepalive,
    body: JSON.stringify({ count }),
  })

  if (cachedStatistics) {
    cachedStatistics = {
      ...cachedStatistics,
      totalBullPlacements: response.totalBullPlacements,
    }
  }

  return response
}

export function invalidatePlayerStatisticsCache() {
  cachedStatistics = null
  inFlightStatisticsPromise = null
}
