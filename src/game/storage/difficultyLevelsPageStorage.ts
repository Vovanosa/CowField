import type { Difficulty, LevelProgress, LevelSummary } from '../types'
import { getLevelsByDifficulty } from './levelStorage'
import { getProgressByDifficulty } from './progressStorage'

export type DifficultyLevelsPageData = {
  levels: LevelSummary[]
  progressByLevelNumber: Record<number, LevelProgress>
}

const cachedByDifficulty = new Map<Difficulty, DifficultyLevelsPageData>()
const inFlightByDifficulty = new Map<Difficulty, Promise<DifficultyLevelsPageData>>()

function clonePageData(data: DifficultyLevelsPageData): DifficultyLevelsPageData {
  return {
    levels: data.levels.map((level) => ({ ...level })),
    progressByLevelNumber: Object.fromEntries(
      Object.entries(data.progressByLevelNumber).map(([levelNumber, progress]) => [
        levelNumber,
        { ...progress },
      ]),
    ),
  }
}

export async function getDifficultyLevelsPageData(
  difficulty: Difficulty,
): Promise<DifficultyLevelsPageData> {
  const cached = cachedByDifficulty.get(difficulty)

  if (cached) {
    return clonePageData(cached)
  }

  const inFlight = inFlightByDifficulty.get(difficulty)

  if (inFlight) {
    return inFlight.then(clonePageData)
  }

  const nextPromise = Promise.all([
    getLevelsByDifficulty(difficulty),
    getProgressByDifficulty(difficulty),
  ])
    .then(([levelsPage, progress]) => {
      const nextData = {
        levels: levelsPage.levels,
        progressByLevelNumber: progress.reduce<Record<number, LevelProgress>>(
          (allProgress, entry) => {
            allProgress[entry.levelNumber] = entry
            return allProgress
          },
          {},
        ),
      } satisfies DifficultyLevelsPageData

      cachedByDifficulty.set(difficulty, nextData)
      inFlightByDifficulty.delete(difficulty)

      return clonePageData(nextData)
    })
    .catch((error) => {
      inFlightByDifficulty.delete(difficulty)
      throw error
    })

  inFlightByDifficulty.set(difficulty, nextPromise)
  return nextPromise
}

export function invalidateDifficultyLevelsPageCache(difficulty?: Difficulty) {
  if (difficulty) {
    cachedByDifficulty.delete(difficulty)
    inFlightByDifficulty.delete(difficulty)
    return
  }

  cachedByDifficulty.clear()
  inFlightByDifficulty.clear()
}
