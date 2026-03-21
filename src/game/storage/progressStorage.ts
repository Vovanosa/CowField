import type { Difficulty, LevelProgress } from '../types'
import { buildAuthenticatedHeaders } from './authSessionStorage'

const API_BASE = '/api/progress'

type DifficultyProgressResponse = {
  difficulty: Difficulty
  levels: LevelProgress[]
}

type CompleteLevelResponse = {
  progress: LevelProgress
  isNewBest: boolean
}

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

export async function getProgressByDifficulty(difficulty: Difficulty) {
  const response = await requestJson<DifficultyProgressResponse>(`/${difficulty}`)
  return response.levels
}

export async function getLevelProgress(difficulty: Difficulty, levelNumber: number) {
  return requestJson<LevelProgress>(`/${difficulty}/${levelNumber}`)
}

export async function completeLevelProgress(
  difficulty: Difficulty,
  levelNumber: number,
  timeSeconds: number,
) {
  return requestJson<CompleteLevelResponse>(`/${difficulty}/${levelNumber}/complete`, {
    method: 'POST',
    body: JSON.stringify({ timeSeconds }),
  })
}
