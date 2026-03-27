import type { Difficulty, LevelProgress } from '../types'
import { getStoredSessionRole } from './authSessionStorage'
import { buildApiUrl } from './apiBase'
import { invalidateDifficultyLevelsPageCache } from './difficultyLevelsPageStorage'
import { invalidateDifficultyOverviewCache } from './difficultyOverviewStorage'
import {
  completeGuestLevelProgress,
  getGuestLevelProgress,
  getGuestProgressByDifficulty,
} from './guestProgressStorage'
import { requestAuthenticatedJson } from './request'
import { invalidatePlayerStatisticsCache } from './statisticsStorage'

const API_BASE = buildApiUrl('/api/progress')

type DifficultyProgressResponse = {
  difficulty: Difficulty
  levels: LevelProgress[]
}

type DifficultyProgressSummary = {
  difficulty: Difficulty
  completedCount: number
}

type CompleteLevelResponse = {
  progress: LevelProgress
  isNewBest: boolean
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  return requestAuthenticatedJson<T>(`${API_BASE}${path}`, init)
}

export async function getProgressByDifficulty(difficulty: Difficulty) {
  if (getStoredSessionRole() === 'guest') {
    return getGuestProgressByDifficulty(difficulty)
  }

  const response = await requestJson<DifficultyProgressResponse>(`/${difficulty}`)
  return response.levels
}

export async function getDifficultyProgressSummary(
  difficulty: Difficulty,
): Promise<DifficultyProgressSummary> {
  if (getStoredSessionRole() === 'guest') {
    const progress = await getGuestProgressByDifficulty(difficulty)

    return {
      difficulty,
      completedCount: progress.filter((entry) => entry.bestTimeSeconds !== null).length,
    }
  }

  return requestJson<DifficultyProgressSummary>(`/${difficulty}/summary`)
}

export async function getLevelProgress(difficulty: Difficulty, levelNumber: number) {
  if (getStoredSessionRole() === 'guest') {
    return getGuestLevelProgress(difficulty, levelNumber)
  }

  return requestJson<LevelProgress>(`/${difficulty}/${levelNumber}`)
}

export async function completeLevelProgress(
  difficulty: Difficulty,
  levelNumber: number,
  timeSeconds: number,
) {
  if (getStoredSessionRole() === 'guest') {
    const response = await completeGuestLevelProgress(difficulty, levelNumber, timeSeconds)
    invalidateDifficultyLevelsPageCache(difficulty)
    invalidateDifficultyOverviewCache()
    return response
  }

  const response = await requestJson<CompleteLevelResponse>(`/${difficulty}/${levelNumber}/complete`, {
    method: 'POST',
    body: JSON.stringify({ timeSeconds }),
  })
  invalidateDifficultyLevelsPageCache(difficulty)
  invalidateDifficultyOverviewCache()
  invalidatePlayerStatisticsCache()
  return response
}
