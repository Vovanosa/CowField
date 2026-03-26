import type {
  Difficulty,
  LevelDefinition,
  LevelDraft,
  LevelEditorDefinition,
  LevelSummary,
} from '../types'
import { getGridSizeForDifficulty } from '../validation'
import { buildAuthenticatedHeaders, getStoredSessionRole } from './authSessionStorage'
import { buildApiUrl } from './apiBase'

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
}

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
  const response = await fetch(`${API_BASE}${path}`, {
    headers: await buildAuthenticatedHeaders(),
    ...init,
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('NOT_FOUND')
    }

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

export async function getLevelsByDifficulty(difficulty: Difficulty) {
  const response = await requestJson<DifficultyListResponse>(`/${difficulty}`)
  return response.levels
    .map(fromSummaryApiRecord)
    .sort((left, right) => left.levelNumber - right.levelNumber)
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

  return fromEditorApiRecord(record)
}

export async function deleteLevel(difficulty: Difficulty, levelNumber: number) {
  return requestJson<{ deleted: boolean }>(`/${difficulty}/${levelNumber}`, {
    method: 'DELETE',
  })
}
