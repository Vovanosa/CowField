import type { Difficulty, LevelSummary } from '../../types'
import { createResource } from '../cache'
import { buildApiUrl, requestAuthenticatedJson } from '../http'

/**
 * The level list for a difficulty — **immutable until an admin writes**, and cached for the session.
 *
 * This used to live inside a cache keyed by *page*: `difficultyLevelsPageStorage` held the level
 * list and the player's progress in one entry, so finishing a level evicted both and the whole
 * 200-level catalogue was downloaded again. Four times in a three-level session — 8 of the 25 API
 * calls in the measured baseline, all of them re-fetching content that had not changed.
 *
 * Keeping it a separate resource is the fix: progress moves constantly, this does not move at all
 * unless an admin saves or deletes a level, and those two paths invalidate it explicitly.
 */

const API_BASE = buildApiUrl('/api/levels')

type LevelApiRecord = {
  difficulty: Difficulty
  levelNumber: number
  title: string
  gridSize: number
  createdAt: string
  updatedAt: string
}

type DifficultyListResponse = {
  difficulty: Difficulty
  levels: LevelApiRecord[]
}

function toLevelSummary(record: LevelApiRecord): LevelSummary {
  return {
    id: `${record.difficulty}-${record.levelNumber}`,
    levelNumber: record.levelNumber,
    title: record.title,
    difficulty: record.difficulty,
    gridSize: record.gridSize,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

const catalogueResource = createResource<Difficulty, LevelSummary[]>({
  load: async (difficulty) => {
    const response = await requestAuthenticatedJson<DifficultyListResponse>(
      `${API_BASE}/${difficulty}`,
    )

    return response.levels
      .map(toLevelSummary)
      .sort((left, right) => left.levelNumber - right.levelNumber)
  },
  clone: (levels) => levels.map((level) => ({ ...level })),
})

export async function getLevelCatalogue(difficulty: Difficulty) {
  return catalogueResource.get(difficulty)
}

export function invalidateLevelCatalogue(difficulty?: Difficulty) {
  catalogueResource.invalidate(difficulty)
}
