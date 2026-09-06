import type {
  Difficulty,
  LevelDefinition,
  LevelDraft,
  LevelEditorDefinition,
  LevelSummary,
} from '../types'
import { getGridSizeForDifficulty } from '../validation'
import { buildApiUrl, getStoredSessionRole, requestAuthenticatedJson } from './http'
import { invalidateDifficultyOverviewCache } from './resources/difficultyOverview'
import {
  getLevelBoard,
  invalidateLevelBoards,
  setLevelBoard,
  type LevelDetailApiRecord,
} from './resources/levelBoard'
import { getLevelCatalogue, invalidateLevelCatalogue } from './resources/levelCatalogue'

/**
 * Level reads and the admin writes.
 *
 * The caching lives in `resources/levelCatalogue.ts` and `resources/levelBoard.ts`; this module owns
 * the mapping between the API's records and the app's domain types, and the two admin-only writes.
 */

const API_BASE = buildApiUrl('/api/levels')
// Re-exported so existing call sites keep working; the list itself lives in levels/constants.ts,
// which both this module and the overview resource can import without a cycle.
export { DIFFICULTIES } from '../levels/constants'

type DifficultyLevelSummaryResponse = {
  difficulty: Difficulty
  totalCount: number
  highestLevelNumber: number | null
}

export type DifficultyLevelSummary = DifficultyLevelSummaryResponse

function fromApiRecord(record: LevelDetailApiRecord): LevelDefinition {
  return {
    id: `${record.difficulty}-${record.levelNumber}`,
    levelNumber: record.levelNumber,
    title: record.title,
    difficulty: record.difficulty,
    gridSize: record.gridSize,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    pensByCell: record.colorsByCell,
    nextLevelNumber: record.nextLevelNumber,
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
  return requestAuthenticatedJson<T>(`${API_BASE}${path}`, init)
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

/**
 * The whole catalogue for a difficulty, cached for the session.
 *
 * There is no `page`/`limit` any more, on either side of the wire. Three pagination implementations
 * existed — a server `?page/?limit` path, a client-side re-slice for when the server ignored them,
 * and the levels page's own grid paging — and only the third ever ran, because nothing passed the
 * options. The whole catalogue is ~25KB and is now fetched once per session.
 */
export async function getLevelsByDifficulty(difficulty: Difficulty): Promise<LevelSummary[]> {
  return getLevelCatalogue(difficulty)
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
  const includeAuthoringData =
    options?.includeAuthoringData ?? getStoredSessionRole() === 'admin'
  const record = await getLevelBoard(difficulty, levelNumber, includeAuthoringData)

  if (!record) {
    // A missing level is an answer, not a failure — the editor opens a blank draft on it.
    return null
  }

  return includeAuthoringData ? fromEditorApiRecord(record) : fromApiRecord(record)
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

  // A save can add a level, which changes what "next level" means for its neighbour, so every board
  // in the session goes. The catalogue for this difficulty goes too — it now has a new title, or a
  // new entry. Progress is deliberately untouched: nothing about a player's times changed.
  invalidateLevelCatalogue(draft.difficulty)
  invalidateLevelBoards()
  invalidateDifficultyOverviewCache()

  // The response is the level we just wrote, so seed it rather than making the editor refetch.
  setLevelBoard(draft.difficulty, draft.levelNumber, true, record)

  return fromEditorApiRecord(record)
}

export async function deleteLevel(difficulty: Difficulty, levelNumber: number) {
  const response = await requestJson<{ deleted: boolean }>(`/${difficulty}/${levelNumber}`, {
    method: 'DELETE',
  })

  invalidateLevelCatalogue(difficulty)
  invalidateLevelBoards()
  invalidateDifficultyOverviewCache()

  return response
}
