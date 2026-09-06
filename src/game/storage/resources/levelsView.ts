import type { Difficulty, LevelProgress, LevelSummary } from '../../types'
import { getLevelCatalogue } from './levelCatalogue'
import { getProgressMapByDifficulty } from './progress'

export type DifficultyLevelsPageData = {
  levels: LevelSummary[]
  progressByLevelNumber: Record<number, LevelProgress>
}

/**
 * What the levels page renders: the catalogue and the player's progress, side by side.
 *
 * This is a **composition, not a cache**. It used to be its own cache holding both halves in one
 * entry, which is precisely why a completed level threw away the level list — the two have wildly
 * different lifetimes and were sharing a slot. Each half now caches itself, and a progress change
 * touches only the progress half.
 *
 * Both are fetched in parallel, and either may already be in memory, so returning to this page
 * after finishing a level is normally **zero requests**.
 */
export async function getDifficultyLevelsPageData(
  difficulty: Difficulty,
): Promise<DifficultyLevelsPageData> {
  const [levels, progressByLevelNumber] = await Promise.all([
    getLevelCatalogue(difficulty),
    getProgressMapByDifficulty(difficulty),
  ])

  return { levels, progressByLevelNumber }
}
