import type { BestTimesByLevel, Difficulty, LevelProgress } from '../../types'
import { createResource } from '../cache'
import {
  buildApiUrl,
  getStoredSessionRole,
  isGuestSession,
  requestAuthenticatedJson,
} from '../http'
import {
  clearGuestProgress,
  completeGuestLevelProgress,
  getAllGuestProgressEntries,
  getGuestBestTimes,
} from '../guestProgressStorage'
import {
  invalidateDifficultyOverviewCache,
  patchDifficultyCompletedCount,
} from './difficultyOverview'
import { invalidatePlayerStatisticsCache } from './statistics'

/**
 * **The** source of progress: one cached `levelNumber → bestTimeSeconds` map per difficulty, and
 * everything else is a selector over it.
 *
 * Before this there were two ways to ask: `GET /api/progress/:difficulty` for the levels page and
 * `GET /api/progress/:difficulty/:levelNumber` per level for the game page. The second was pure
 * duplication — the row it returned was already inside the first, and after a completion the server
 * returned that same row a third time. Entering a level cost two progress requests (the level's own
 * and the previous level's, for the unlock check) and both were already in memory.
 *
 * And the collection itself was a full record per completed level. The only thing any screen renders
 * is the best time, and an absent entry already means "not played" — so it is a map of numbers.
 */

const API_BASE = buildApiUrl('/api/progress')

type BestTimesResponse = {
  difficulty: Difficulty
  bestTimes: BestTimesByLevel
}

type CompleteLevelResponse = {
  progress: LevelProgress
  isNewBest: boolean
}

const progressResource = createResource<Difficulty, BestTimesByLevel>({
  // The one place that asks where progress lives. Guest progress never leaves the device and answers
  // in the same shape, so from here up nothing else needs to know which backend it came from.
  load: async (difficulty) => {
    // Since P18 a visitor with no session can open `/levels` and a board. There is no progress
    // endpoint that answers them — and no request worth making, because whatever this device
    // remembers from a previous guest session is the honest answer and it is already local.
    if (isGuestSession() || !getStoredSessionRole()) {
      return getGuestBestTimes(difficulty)
    }

    const response = await requestAuthenticatedJson<BestTimesResponse>(`${API_BASE}/${difficulty}`)

    return response.bestTimes
  },
  clone: (bestTimes) => ({ ...bestTimes }),
})

export async function getBestTimes(difficulty: Difficulty) {
  return progressResource.get(difficulty)
}

/** A lookup in the cached map — **not** a request. `null` means the level has not been finished. */
export async function getBestTime(difficulty: Difficulty, levelNumber: number) {
  const bestTimes = await progressResource.get(difficulty)

  return bestTimes[levelNumber] ?? null
}

/** The cached best time without loading anything. `undefined` when the map is cold. */
export function peekBestTime(difficulty: Difficulty, levelNumber: number) {
  const bestTimes = progressResource.peek(difficulty)

  return bestTimes ? (bestTimes[levelNumber] ?? null) : undefined
}

export type CompleteLevelOptions = {
  /**
   * Bulls placed since the last flush, sent along with the completion instead of as a second
   * request. See the server's `completeLevelInputSchema`.
   */
  bullPlacements?: number
}

export type CompleteLevelResult = {
  bestTimeSeconds: number | null
  isNewBest: boolean
  /**
   * Whether this was the **first** time the level was cleared, or `null` when the map was cold and
   * there is no way to tell.
   *
   * The difficulty overview's `completedCount` moves only on a first clear, so this is what lets it
   * be patched instead of refetched. `null` means "don't guess" — the overview is invalidated.
   */
  isFirstClear: boolean | null
}

export async function completeLevelProgress(
  difficulty: Difficulty,
  levelNumber: number,
  timeSeconds: number,
  options?: CompleteLevelOptions,
): Promise<CompleteLevelResult> {
  const previousBestTime = peekBestTime(difficulty, levelNumber)

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

  const bestTimeSeconds = response.progress.bestTimeSeconds

  // The server just told us the new best time, so write it in. This is what replaces invalidating
  // everything after a completion.
  if (bestTimeSeconds !== null) {
    progressResource.patch(difficulty, (bestTimes) => ({
      ...bestTimes,
      [levelNumber]: bestTimeSeconds,
    }))
  }

  const isFirstClear = previousBestTime === undefined ? null : previousBestTime === null

  // What a completion is allowed to touch, and nothing more. It used to invalidate the levels page
  // wholesale — which took the immutable 200-level catalogue with it — plus the overview and the
  // statistics summary. The catalogue is now untouched, and the overview moves by one.
  if (isFirstClear === null) {
    // The map was cold, so there is no way to know whether this was a first clear. Refetching the
    // overview is the honest option; guessing would drift the count.
    invalidateDifficultyOverviewCache()
  } else if (isFirstClear) {
    patchDifficultyCompletedCount(difficulty, 1)
  }

  // Statistics is genuinely stale now — averages and the fastest level per difficulty all move, and
  // they are not derivable from this response. Costs nothing in the play loop: it is only fetched
  // when the Statistics page is opened.
  invalidatePlayerStatisticsCache()

  return {
    bestTimeSeconds,
    isNewBest: response.isNewBest,
    isFirstClear,
  }
}

export function invalidateProgress(difficulty?: Difficulty) {
  progressResource.invalidate(difficulty)
}

/**
 * Hands this browser's guest progress to the account that has just been created (P18, decision D5).
 *
 * **One request, not a loop.** A loop over `completeLevelProgress` would be up to a thousand round
 * trips and could fail half-way, leaving an account with part of its history and no record of which
 * part. The endpoint writes the lot in one transaction.
 *
 * **The local copy is cleared only after the server acknowledges**, in that order and no other: it
 * is the only copy in existence until the response arrives. A failure leaves it exactly where it
 * was, so the next attempt still has something to send.
 *
 * Returns the number of levels carried over, or `null` when there was nothing to carry.
 */
export async function importGuestProgressIntoAccount() {
  const entries = getAllGuestProgressEntries()

  if (entries.length === 0) {
    return null
  }

  const result = await requestAuthenticatedJson<{ importedCount: number }>(`${API_BASE}/import`, {
    method: 'POST',
    body: JSON.stringify({ entries }),
  })

  clearGuestProgress()

  // Everything derived from progress is now wrong: the per-difficulty maps, the counts on the
  // difficulty chips, and every statistic. None of it is patchable from this response, and this
  // happens once in an account's life, so invalidating outright is both correct and cheap.
  progressResource.invalidate()
  invalidateDifficultyOverviewCache()
  invalidatePlayerStatisticsCache()

  return result.importedCount
}
