import type {
  Difficulty,
  LevelDefinition,
  LevelDraft,
  LevelEditorDefinition,
  LevelSummary,
} from '../types'
import { getGridSizeForDifficulty } from '../validation'
import { buildApiUrl } from './apiBase'
import { getStoredSessionRole } from './authSessionStorage'
import { invalidateDifficultyLevelsPageCache } from './difficultyLevelsPageStorage'
import { invalidateDifficultyOverviewCache } from './difficultyOverviewStorage'
import { requestAuthenticatedJson } from './request'

const API_BASE = buildApiUrl('/api/levels')
export const DIFFICULTIES: Difficulty[] = ['light', 'easy', 'medium', 'hard']

type LevelApiRecord = {
  difficulty: Difficulty
  levelNumber: number
  title: string
  gridSize: number
  createdAt: string
  updatedAt: string
}

type LevelDetailApiRecord = LevelApiRecord & {
  colorsByCell: number[]
  cowsByCell?: boolean[]
  hasNextLevel: boolean
}

type DifficultyListResponse = {
  difficulty: Difficulty
  levels: LevelApiRecord[]
  totalCount?: number
  page?: number
  limit?: number
  totalPages?: number
}

type DifficultyLevelSummaryResponse = {
  difficulty: Difficulty
  totalCount: number
  highestLevelNumber: number | null
}

export type PaginatedLevelsResult = {
  difficulty: Difficulty
  levels: LevelSummary[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

export type DifficultyLevelSummary = DifficultyLevelSummaryResponse

function fromSummaryApiRecord(record: LevelApiRecord): LevelSummary {
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

function fromApiRecord(record: LevelDetailApiRecord): LevelDefinition {
  return {
    ...fromSummaryApiRecord(record),
    pensByCell: record.colorsByCell,
    hasNextLevel: record.hasNextLevel,
  }
}

function fromEditorApiRecord(record: LevelDetailApiRecord): LevelEditorDefinition {
  return {
    ...fromApiRecord(record),
    cowsByCell:
      record.cowsByCell ??
      Array.from({ length: record.gridSize * record.gridSize }, () => false),
  }
}

function toApiPayload(draft: LevelDraft) {
  return {
    title: draft.title,
    difficulty: draft.difficulty,
    levelNumber: draft.levelNumber,
    gridSize: draft.gridSize,
    colorsByCell: draft.pensByCell,
    cowsByCell: draft.cowsByCell,
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await requestAuthenticatedJson<T>(`${API_BASE}${path}`, init)
  } catch (error) {
    if (error instanceof Error && error.message === 'Level not found.') {
      throw new Error('NOT_FOUND')
    }

    throw error
  }
}

export function createEmptyLevelDraft(
  difficulty: Difficulty,
  levelNumber: number,
): LevelDraft {
  const gridSize = getGridSizeForDifficulty(difficulty)

  return {
    levelNumber,
    title: `Level ${levelNumber}`,
    difficulty,
    gridSize,
    pensByCell: Array.from({ length: gridSize * gridSize }, () => 0),
    cowsByCell: Array.from({ length: gridSize * gridSize }, () => false),
  }
}

export async function getLevelsByDifficulty(
  difficulty: Difficulty,
  options?: {
    page?: number
    limit?: number
  },
): Promise<PaginatedLevelsResult> {
  const searchParams = new URLSearchParams()

  if (options?.page !== undefined) {
    searchParams.set('page', String(options.page))
  }

  if (options?.limit !== undefined) {
    searchParams.set('limit', String(options.limit))
  }

  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : ''
  const response = await requestJson<DifficultyListResponse>(`/${difficulty}${query}`)
  const sortedLevels = response.levels
    .map(fromSummaryApiRecord)
    .sort((left, right) => left.levelNumber - right.levelNumber)

  const requestedPage = options?.page ?? response.page ?? 1
  const requestedLimit = options?.limit ?? response.limit ?? sortedLevels.length ?? 1
  const hasServerPagination =
    typeof response.totalCount === 'number' &&
    typeof response.page === 'number' &&
    typeof response.limit === 'number' &&
    typeof response.totalPages === 'number'

  if (hasServerPagination) {
    return {
      difficulty: response.difficulty,
      levels: sortedLevels,
      totalCount: response.totalCount!,
      page: response.page!,
      limit: response.limit!,
      totalPages: response.totalPages!,
    }
  }

  const totalCount = sortedLevels.length
  const totalPages = Math.max(Math.ceil(totalCount / requestedLimit), 1)
  const normalizedPage = Math.min(Math.max(requestedPage, 1), totalPages)
  const startIndex = (normalizedPage - 1) * requestedLimit
  const endIndex = startIndex + requestedLimit

  return {
    difficulty: response.difficulty,
    levels: sortedLevels.slice(startIndex, endIndex),
    totalCount,
    page: normalizedPage,
    limit: requestedLimit,
    totalPages,
  }
}

export async function getDifficultyLevelSummary(
  difficulty: Difficulty,
): Promise<DifficultyLevelSummary> {
  return requestJson<DifficultyLevelSummaryResponse>(`/${difficulty}/summary`)
}

export async function getLevelByDifficultyAndNumber(
  difficulty: Difficulty,
  levelNumber: number,
  options: {
    includeAuthoringData: true
  },
): Promise<LevelEditorDefinition | null>
export async function getLevelByDifficultyAndNumber(
  difficulty: Difficulty,
  levelNumber: number,
  options?: {
    includeAuthoringData?: false
  },
): Promise<LevelDefinition | null>
export async function getLevelByDifficultyAndNumber(
  difficulty: Difficulty,
  levelNumber: number,
  options?: {
    includeAuthoringData?: boolean
  },
) {
  try {
    const record = await requestJson<LevelDetailApiRecord>(`/${difficulty}/${levelNumber}`)
    const includeAuthoringData =
      options?.includeAuthoringData ?? getStoredSessionRole() === 'admin'

    return includeAuthoringData ? fromEditorApiRecord(record) : fromApiRecord(record)
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return null
    }

    throw error
  }
}

export async function saveLevel(draft: LevelDraft) {
  const payload = toApiPayload(draft)
  const record = await requestJson<LevelDetailApiRecord>(
    `/${draft.difficulty}/${draft.levelNumber}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
  invalidateDifficultyLevelsPageCache(draft.difficulty)
  invalidateDifficultyOverviewCache()

  return fromEditorApiRecord(record)
}

export async function deleteLevel(difficulty: Difficulty, levelNumber: number) {
  const response = await requestJson<{ deleted: boolean }>(`/${difficulty}/${levelNumber}`, {
    method: 'DELETE',
  })
  invalidateDifficultyLevelsPageCache(difficulty)
  invalidateDifficultyOverviewCache()
  return response
}
