import { DIFFICULTIES } from '../levels/constants'
import type { Difficulty } from '../types'
import { createResource } from './cache'
import { buildApiUrl, getStoredSessionRole, requestAuthenticatedJson } from './http'
import { getGuestProgressByDifficulty } from './guestProgressStorage'

type DifficultyOverviewItem = {
  difficulty: Difficulty
  totalCount: number
  completedCount: number
}

type DifficultyOverviewResponse = {
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
  const guestProgressByDifficulty = await Promise.all(
    DIFFICULTIES.map((difficulty) => getGuestProgressByDifficulty(difficulty)),
  )
  const completedByDifficulty = new Map<Difficulty, number>(
    guestProgressByDifficulty.map((progress, index) => [
      DIFFICULTIES[index],
      progress.filter((entry) => entry.bestTimeSeconds !== null).length,
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
    getStoredSessionRole() === 'guest'
      ? loadGuestOverview()
      : requestAuthenticatedJson<DifficultyOverviewResponse>(`${PROGRESS_API_BASE}/overview`),
  clone: cloneOverview,
})

export async function getDifficultyOverview() {
  return overviewResource.get(OVERVIEW_KEY)
}

export function invalidateDifficultyOverviewCache() {
  overviewResource.invalidate()
}
