import type { LevelDefinition, LevelProgress } from './types'

export function getUnlockedLevelNumbers(
  levels: LevelDefinition[],
  progressByLevelNumber: Record<number, LevelProgress>,
) {
  const unlockedLevelNumbers = new Set<number>()

  for (const level of levels) {
    const isFirstLevel = unlockedLevelNumbers.size === 0
    const previousLevelProgress = progressByLevelNumber[level.levelNumber - 1]
    const isUnlocked =
      isFirstLevel ||
      (previousLevelProgress !== undefined && previousLevelProgress.bestTimeSeconds !== null)

    if (!isUnlocked) {
      break
    }

    unlockedLevelNumbers.add(level.levelNumber)
  }

  return unlockedLevelNumbers
}
