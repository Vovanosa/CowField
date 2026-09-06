import { MAX_BULL_PLACEMENTS_PER_REQUEST } from '../../../shared/apiLimits'
import type { PlayerStatisticsSummary } from '../types'
import { createResource } from './cache'
import { buildApiUrl, requestAuthenticatedJson } from './http'

const API_BASE = buildApiUrl('/api/statistics')

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  return requestAuthenticatedJson<T>(`${API_BASE}${path}`, init)
}

function cloneStatistics(statistics: PlayerStatisticsSummary): PlayerStatisticsSummary {
  return {
    ...statistics,
    byDifficulty: statistics.byDifficulty.map((item) => ({
      ...item,
      fastestLevel: item.fastestLevel ? { ...item.fastestLevel } : null,
    })),
  }
}

/**
 * There is one statistics summary per player, so the key is a constant.
 *
 * No TTL: it changes only when this client causes it to, and when it does the write patches it
 * rather than evicting it.
 */
const STATISTICS_KEY = 'self'

const statisticsResource = createResource<string, PlayerStatisticsSummary>({
  load: () => requestJson<PlayerStatisticsSummary>('/'),
  clone: cloneStatistics,
})

export async function getPlayerStatistics() {
  return statisticsResource.get(STATISTICS_KEY)
}

export async function recordBullPlacements(count: number, keepalive = false) {
  if (count <= 0) {
    return { totalBullPlacements: 0 }
  }

  // Clamped to the API's ceiling (`shared/apiLimits.ts`) rather than sent and rejected: this call is
  // fire-and-forget, so a 400 here would silently drop the whole batch.
  const boundedCount = Math.min(count, MAX_BULL_PLACEMENTS_PER_REQUEST)

  const response = await requestJson<{ totalBullPlacements: number }>('/bull-placement', {
    method: 'POST',
    keepalive,
    body: JSON.stringify({ count: boundedCount }),
  })

  // The server just told us the new total, so write it in rather than throwing the summary away and
  // fetching all of it back on the next Statistics visit.
  statisticsResource.patch(STATISTICS_KEY, (current) => ({
    ...current,
    totalBullPlacements: response.totalBullPlacements,
  }))

  return response
}

export function invalidatePlayerStatisticsCache() {
  statisticsResource.invalidate()
}
