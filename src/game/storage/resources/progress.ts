import type { Difficulty, LevelProgress } from '../../types'
import { createResource } from '../cache'
import { buildApiUrl, isGuestSession, requestAuthenticatedJson } from '../http'
import {
  completeGuestLevelProgress,
  getGuestProgressByDifficulty,
} from '../guestProgressStorage'
import {
  invalidateDifficultyOverviewCache,
  patchDifficultyCompletedCount,
} from './difficultyOverview'
import { invalidatePlayerStatisticsCache } from './statistics'

/**
 * **The** source of progress. One cached collection per difficulty, and everything else is a
 * selector over it.
 *
 * Before this there were two ways to ask: `GET /api/progress/:difficulty` for the levels page and
 * `GET /api/progress/:difficulty/:levelNumber` per level for the game page. The second was pure
 * duplication — the row it returned was already inside the first, and after a completion the server
 * returned that same row a third time. Entering a level cost two progress requests (the level's own
 * and the previous level's, for the unlock check) and both were already in memory.
 *
 * Now: one request per difficulty per session, and `getLevelProgress` is a lookup.
 */

const API_BASE = buildApiUrl('/api/progress')

type DifficultyProgressResponse = {
  difficulty: Difficulty
  levels: LevelProgress[]
}

export type CompleteLevelResponse = {
  progress: LevelProgress
  isNewBest: boolean
}

/**
 * The "nothing recorded yet" placeholder for a level the player has never touched.
 *
 * The collection only contains rows that exist, so this is what a lookup miss means. `updatedAt` is
 * `null`, not `''` — there is no timestamp, and an empty string formats as an Invalid Date.
 * Identical to what `GET /api/progress/:d/:n` used to synthesise server-side.
 */
function createEmptyProgress(difficulty: Difficulty, levelNumber: number): LevelProgress {
  return {
    difficulty,
    levelNumber,
    bestTimeSeconds: null,
    completedAt: null,
    updatedAt: null,
  }
}

const progressResource = createResource<Difficulty, LevelProgress[]>({
  // The one place that asks whether this is a guest. Guest progress never leaves the device, and it
  // has the same shape, so from here up nothing else needs to know which backend it came from.
  load: async (difficulty) => {
    if (isGuestSession()) {
      return getGuestProgressByDifficulty(difficulty)
    }

    const response = await requestAuthenticatedJson<DifficultyProgressResponse>(
      `${API_BASE}/${difficulty}`,
    )

    return response.levels
  },
  clone: (rows) => rows.map((row) => ({ ...row })),
})

export async function getProgressByDifficulty(difficulty: Difficulty) {
  return progressResource.get(difficulty)
}

export async function getProgressMapByDifficulty(difficulty: Difficulty) {
  const rows = await progressResource.get(difficulty)

  return rows.reduce<Record<number, LevelProgress>>((byLevelNumber, row) => {
    byLevelNumber[row.levelNumber] = row
    return byLevelNumber
  }, {})
}

/** A lookup in the cached collection — **not** a request. */
export async function getLevelProgress(difficulty: Difficulty, levelNumber: number) {
  const rows = await progressResource.get(difficulty)

  return (
    rows.find((row) => row.levelNumber === levelNumber) ??
    createEmptyProgress(difficulty, levelNumber)
  )
}

/**
 * Writes a row the server just returned back into the collection.
 *
 * This is what replaces invalidating everything after a completion. The server's response *is* the
 * new row, so there is nothing to go and fetch.
 */
function patchProgressRow(difficulty: Difficulty, nextRow: LevelProgress) {
  progressResource.patch(difficulty, (rows) => {
    const index = rows.findIndex((row) => row.levelNumber === nextRow.levelNumber)

    if (index === -1) {
      return [...rows, nextRow].sort((left, right) => left.levelNumber - right.levelNumber)
    }

    return rows.map((row, rowIndex) => (rowIndex === index ? nextRow : row))
  })
}

/** The cached row for a level, without loading anything. `undefined` when the collection is cold. */
export function peekLevelProgress(difficulty: Difficulty, levelNumber: number) {
  const rows = progressResource.peek(difficulty)

  if (!rows) {
    return undefined
  }

  return (
    rows.find((row) => row.levelNumber === levelNumber) ??
    createEmptyProgress(difficulty, levelNumber)
  )
}

export type CompleteLevelOptions = {
  /**
   * Bulls placed since the last flush, sent along with the completion instead of as a second
   * request. See the server's `completeLevelInputSchema`.
   */
  bullPlacements?: number
}

export type CompleteLevelResult = CompleteLevelResponse & {
  /**
   * Whether this was the **first** time the level was cleared, or `null` when the collection was
   * cold and there is no way to tell.
   *
   * The difficulty overview's `completedCount` moves only on a first clear, so this is what lets it
   * be patched instead of refetched. `null` means "don't guess" — the caller invalidates it instead.
   */
  isFirstClear: boolean | null
}

export async function completeLevelProgress(
  difficulty: Difficulty,
  levelNumber: number,
  timeSeconds: number,
  options?: CompleteLevelOptions,
): Promise<CompleteLevelResult> {
  const previousRow = peekLevelProgress(difficulty, levelNumber)

  const response = isGuestSession()
    ? await completeGuestLevelProgress(difficulty, levelNumber, timeSeconds)
    : await requestAuthenticatedJson<CompleteLevelResponse>(
        `${API_BASE}/${difficulty}/${levelNumber}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            timeSeconds,
            ...(options?.bullPlacements ? { bullPlacements: options.bullPlacements } : {}),
          }),
        },
      )

  patchProgressRow(difficulty, response.progress)

  const isFirstClear = previousRow === undefined ? null : previousRow.bestTimeSeconds === null

  // What a completion is allowed to touch, and nothing more. It used to invalidate the levels page
  // wholesale — which took the immutable 200-level catalogue with it — plus the overview and the
  // statistics summary. The catalogue is now untouched, and the overview moves by one.
  if (isFirstClear === null) {
    // The collection was cold, so there is no way to know whether this was a first clear. Refetching
    // the overview is the honest option; guessing would drift the count.
    invalidateDifficultyOverviewCache()
  } else if (isFirstClear) {
    patchDifficultyCompletedCount(difficulty, 1)
  }

  // Statistics is genuinely stale now — averages and the fastest level per difficulty all move, and
  // they are not derivable from this response. Costs nothing in the play loop: it is only fetched
  // when the Statistics page is opened.
  invalidatePlayerStatisticsCache()

  return {
    ...response,
    isFirstClear,
  }
}

export function invalidateProgress(difficulty?: Difficulty) {
  progressResource.invalidate(difficulty)
}
