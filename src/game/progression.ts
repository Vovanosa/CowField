import type { BestTimesByLevel } from './types'

/**
 * NOTE: this has **no callers**. The levels page computes the same rule inline while rendering each
 * card. Kept for now; it is a cleanup-phase decision whether to delete it or route the page through
 * it. See plan.md P11.
 *
 * A level is unlocked when the one before it by number has a recorded best time.
 */
export function getUnlockedLevelNumbers(levelNumbers: number[], bestTimes: BestTimesByLevel) {
  const unlockedLevelNumbers = new Set<number>()

  for (const levelNumber of levelNumbers) {
    const isFirstLevel = unlockedLevelNumbers.size === 0
    const isUnlocked = isFirstLevel || bestTimes[levelNumber - 1] !== undefined

    if (!isUnlocked) {
      break
    }

    unlockedLevelNumbers.add(levelNumber)
  }

  return unlockedLevelNumbers
}
