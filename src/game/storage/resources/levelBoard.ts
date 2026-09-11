import type { Difficulty } from '../../types'
import { createResource } from '../cache'
import { ApiError, buildApiUrl, requestOptionallyAuthenticatedJson } from '../http'

/**
 * One level's board. **Immutable content with no cache at all before this.**
 *
 * Re-entering a level, or bouncing between a level and the list, re-downloaded a board that cannot
 * change under the player. There is no TTL because there is nothing to expire against: an admin
 * saving or deleting a level invalidates it explicitly, and that is the only way it changes.
 *
 * The key includes `includeAuthoringData` because the server strips `cowsByCell` for non-admins —
 * the same level number genuinely has two different response shapes, and they must not share a slot.
 */

const API_BASE = buildApiUrl('/api/levels')

export type LevelDetailApiRecord = {
  difficulty: Difficulty
  levelNumber: number
  title: string
  gridSize: number
  createdAt: string
  updatedAt: string
  colorsByCell: number[]
  cowsByCell?: boolean[]
  /** The next level's number, or `null` when this is the last one. */
  nextLevelNumber: number | null
}

type BoardKey = {
  difficulty: Difficulty
  levelNumber: number
  includeAuthoringData: boolean
}

const boardResource = createResource<BoardKey, LevelDetailApiRecord | null>({
  load: async (key) => {
    try {
      return await requestOptionallyAuthenticatedJson<LevelDetailApiRecord>(
        `${API_BASE}/${key.difficulty}/${key.levelNumber}`,
      )
    } catch (error) {
      // A missing level is an answer, and worth caching as one — otherwise every render of a
      // "level does not exist" screen asks again.
      if (error instanceof ApiError && error.isNotFound) {
        return null
      }

      throw error
    }
  },
  toCacheKey: (key) =>
    `${key.difficulty}:${key.levelNumber}:${key.includeAuthoringData ? 'admin' : 'player'}`,
  clone: (record) =>
    record === null
      ? null
      : {
          ...record,
          colorsByCell: [...record.colorsByCell],
          ...(record.cowsByCell ? { cowsByCell: [...record.cowsByCell] } : {}),
        },
})

export async function getLevelBoard(
  difficulty: Difficulty,
  levelNumber: number,
  includeAuthoringData: boolean,
) {
  return boardResource.get({ difficulty, levelNumber, includeAuthoringData })
}

export function setLevelBoard(
  difficulty: Difficulty,
  levelNumber: number,
  includeAuthoringData: boolean,
  record: LevelDetailApiRecord,
) {
  boardResource.set({ difficulty, levelNumber, includeAuthoringData }, record)
}

/**
 * Drops cached boards.
 *
 * Called with no argument for anything that could have changed more than one board — a save that
 * shifts what "next level" means, a delete, or a sign-in. Boards are cheap to refetch and there is
 * no key-range invalidation, so clearing all of them is both correct and rare.
 */
export function invalidateLevelBoards() {
  boardResource.invalidate()
}
