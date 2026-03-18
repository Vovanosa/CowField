import type { Difficulty, LevelDefinition, LevelDraft } from '../types'
import { getGridSizeForDifficulty } from '../validation'

const API_BASE = '/api/levels'
export const DIFFICULTIES: Difficulty[] = ['light', 'easy', 'medium', 'hard']

type LevelApiRecord = {
  difficulty: Difficulty
  levelNumber: number
  title: string
  gridSize: number
  colorsByCell: number[]
  cowsByCell: boolean[]
  createdAt: string
  updatedAt: string
}

type DifficultyListResponse = {
  difficulty: Difficulty
  levels: LevelApiRecord[]
}

type NextLevelNumberResponse = {
  difficulty: Difficulty
  nextLevelNumber: number
}

function fromApiRecord(record: LevelApiRecord): LevelDefinition {
  return {
    id: `${record.difficulty}-${record.levelNumber}`,
    levelNumber: record.levelNumber,
    title: record.title,
    difficulty: record.difficulty,
    gridSize: record.gridSize,
    pensByCell: record.colorsByCell,
    cowsByCell: record.cowsByCell,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
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
    headers: {
      'Content-Type': 'application/json',
    },
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
    .map(fromApiRecord)
    .sort((left, right) => left.levelNumber - right.levelNumber)
}

export async function getLevelByDifficultyAndNumber(
  difficulty: Difficulty,
  levelNumber: number,
) {
  try {
    const record = await requestJson<LevelApiRecord>(`/${difficulty}/${levelNumber}`)
    return fromApiRecord(record)
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return null
    }

    throw error
  }
}

export async function getNextLevelNumber(difficulty: Difficulty) {
  const response = await requestJson<NextLevelNumberResponse>(
    `/${difficulty}/next-level-number`,
  )

  return response.nextLevelNumber
}

export async function saveLevel(draft: LevelDraft) {
  const payload = toApiPayload(draft)
  const record = await requestJson<LevelApiRecord>(
    `/${draft.difficulty}/${draft.levelNumber}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  return fromApiRecord(record)
}

export async function deleteLevel(difficulty: Difficulty, levelNumber: number) {
  return requestJson<{ deleted: boolean }>(`/${difficulty}/${levelNumber}`, {
    method: 'DELETE',
  })
}
