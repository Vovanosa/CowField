import type { Difficulty } from './level'

export type LevelProgress = {
  difficulty: Difficulty
  levelNumber: number
  bestTimeSeconds: number | null
  completedAt: string | null
  /** Null when nothing has ever been recorded for this level. */
  updatedAt: string | null
}

/**
 * A difficulty's best times, keyed by level number — the shape the API sends and the client caches.
 *
 * An **absent key means "not played"**, which is what every screen already assumed. The list this
 * replaced sent a full `LevelProgress` per completed level, with the difficulty repeated on each and
 * `completedAt`/`updatedAt` that nothing reads.
 *
 * **The value is never null**, despite `LevelProgress.bestTimeSeconds` being nullable: a completion
 * always records the elapsed seconds, because `take your time` only hides the clock rather than
 * stopping it. So the key's presence is the completion, and that is what the levels page tests —
 * see `LevelCard.isSolved`.
 */
export type BestTimesByLevel = Record<number, number>
