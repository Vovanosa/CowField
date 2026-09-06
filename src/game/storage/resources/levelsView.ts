import type { BestTimesByLevel, Difficulty } from '../../types'
import { getLevelCatalogue } from './levelCatalogue'
import { getBestTimes } from './progress'

export type DifficultyLevelsPageData = {
  /** Which levels exist, ascending. */
  levelNumbers: number[]
  /** `levelNumber → bestTimeSeconds`; an absent entry means the level has not been finished. */
  bestTimes: BestTimesByLevel
}

/**
 * What the levels page renders: which levels exist, and how fast the player has been at them.
 *
 * This is a **composition, not a cache**. It used to be its own cache holding both halves in one
 * entry, which is precisely why a completed level threw away the level list — the two have wildly
 * different lifetimes and were sharing a slot. Each half now caches itself, and a progress change
 * touches only the progress half.
 *
 * Both are fetched in parallel, and either may already be in memory, so returning to this page after
 * finishing a level is normally **zero requests**.
 */
export async function getDifficultyLevelsPageData(
  difficulty: Difficulty,
): Promise<DifficultyLevelsPageData> {
  const [levelNumbers, bestTimes] = await Promise.all([
    getLevelCatalogue(difficulty),
    getBestTimes(difficulty),
  ])

  return { levelNumbers, bestTimes }
}
