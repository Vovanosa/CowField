import { DIFFICULTIES } from '../../levels/constants'
import type { Difficulty } from '../../types'
import { createResource } from '../cache'
import { buildApiUrl, isGuestSession, requestAuthenticatedJson } from '../http'
import { getGuestBestTimes } from '../guestProgressStorage'

type DifficultyOverviewItem = {
  difficulty: Difficulty
  totalCount: number
  completedCount: number
}

export type DifficultyOverviewResponse = {
  difficulties: DifficultyOverviewItem[]
}

type LevelsOverviewResponse = {
  difficulties: Array<{
    difficulty: Difficulty
    totalCount: number
    highestLevelNumber: number | null
  }>
}

const PROGRESS_API_BASE = buildApiUrl('/api/progress')
const LEVELS_API_BASE = buildApiUrl('/api/levels')

function cloneOverview(overview: DifficultyOverviewResponse): DifficultyOverviewResponse {
  return {
    difficulties: overview.difficulties.map((item) => ({ ...item })),
  }
}

async function loadGuestOverview(): Promise<DifficultyOverviewResponse> {
  const levelsOverview = await requestAuthenticatedJson<LevelsOverviewResponse>(
    `${LEVELS_API_BASE}/overview`,
  )
  const guestBestTimes = await Promise.all(
    DIFFICULTIES.map((difficulty) => getGuestBestTimes(difficulty)),
  )
  // A key exists only for a level that has been finished, so the count is the size of the map.
  const completedByDifficulty = new Map<Difficulty, number>(
    guestBestTimes.map((bestTimes, index) => [
      DIFFICULTIES[index],
      Object.keys(bestTimes).length,
    ]),
  )

  return {
    difficulties: levelsOverview.difficulties.map((item) => ({
      difficulty: item.difficulty,
      totalCount: item.totalCount,
      completedCount: completedByDifficulty.get(item.difficulty) ?? 0,
    })),
  }
}

/** One overview per player, so the key is a constant. In-flight dedup comes from the primitive. */
const OVERVIEW_KEY = 'self'

const overviewResource = createResource<string, DifficultyOverviewResponse>({
  load: () =>
    isGuestSession()
      ? loadGuestOverview()
      : requestAuthenticatedJson<DifficultyOverviewResponse>(`${PROGRESS_API_BASE}/overview`),
  clone: cloneOverview,
})

export async function getDifficultyOverview() {
  return overviewResource.get(OVERVIEW_KEY)
}

/**
 * Nudges one difficulty's completed count, for a first clear.
 *
 * `completedCount` is the only field a completion can move — `totalCount` is the level library, not
 * the player. Patching it is what stops the difficulty list being refetched every time you finish a
 * level and walk back to it.
 */
export function patchDifficultyCompletedCount(difficulty: Difficulty, delta: number) {
  overviewResource.patch(OVERVIEW_KEY, (current) => ({
    difficulties: current.difficulties.map((item) =>
      item.difficulty === difficulty
        ? {
            ...item,
            completedCount: Math.min(Math.max(item.completedCount + delta, 0), item.totalCount),
          }
        : item,
    ),
  }))
}

export function invalidateDifficultyOverviewCache() {
  overviewResource.invalidate()
}
