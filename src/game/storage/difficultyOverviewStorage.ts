import type { Difficulty } from '../types'
import { getStoredSessionRole } from './authSessionStorage'
import { buildApiUrl } from './apiBase'
import { getGuestProgressByDifficulty } from './guestProgressStorage'
import { requestAuthenticatedJson } from './request'

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
const DIFFICULTIES: Difficulty[] = ['light', 'easy', 'medium', 'hard']

let cachedOverview: DifficultyOverviewResponse | null = null
let inFlightOverviewPromise: Promise<DifficultyOverviewResponse> | null = null

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

export async function getDifficultyOverview() {
  if (cachedOverview) {
    return cloneOverview(cachedOverview)
  }

  if (inFlightOverviewPromise) {
    return inFlightOverviewPromise.then(cloneOverview)
  }

  inFlightOverviewPromise = (async () => {
    const overview =
      getStoredSessionRole() === 'guest'
        ? await loadGuestOverview()
        : await requestAuthenticatedJson<DifficultyOverviewResponse>(
            `${PROGRESS_API_BASE}/overview`,
          )

    cachedOverview = overview
    inFlightOverviewPromise = null
    return cloneOverview(overview)
  })().catch((error) => {
    inFlightOverviewPromise = null
    throw error
  })

  return inFlightOverviewPromise
}

export function invalidateDifficultyOverviewCache() {
  cachedOverview = null
  inFlightOverviewPromise = null
}
