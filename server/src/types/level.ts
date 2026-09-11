import { z } from 'zod'

export const difficultySchema = z.enum(['light', 'easy', 'medium', 'hard', 'extreme'])

export type Difficulty = z.infer<typeof difficultySchema>

/**
 * Every difficulty, in play order.
 *
 * Derived from the schema rather than written out again, so the list and the validator can never
 * disagree. Use this instead of writing the array out again locally.
 */
export const DIFFICULTIES: readonly Difficulty[] = difficultySchema.options

export type LevelRecord = {
  difficulty: Difficulty
  levelNumber: number
  title: string
  gridSize: number
  colorsByCell: number[]
  cowsByCell: boolean[]
  createdAt: string
  updatedAt: string
}


export type LevelDifficultySummaryRecord = {
  difficulty: Difficulty
  totalCount: number
  highestLevelNumber: number | null
}
export type LevelsOverviewRecord = {
  difficulties: LevelDifficultySummaryRecord[]
}
/**
 * The whole catalogue for a difficulty: **which level numbers exist**, and nothing else.
 *
 * This used to be a full record per level — difficulty repeated 200 times, a title nothing renders,
 * a gridSize that is a rule of the difficulty, and two timestamps no screen has ever shown. 30 KB of
 * response for 200 levels, of which the level numbers were 0.7 KB. The level cards show a number and
 * a best time; that is the whole contract.
 */
export type LevelCatalogueRecord = {
  difficulty: Difficulty
  levelNumbers: number[]
}
/**
 * A playable board — what the game page needs and not a field more.
 *
 * `title`, `createdAt` and `updatedAt` are on the row but are never rendered during play, so they
 * do not travel. `nextLevelNumber` replaced a `hasNextLevel` boolean.
 */
export type LevelPublicRecord = {
  difficulty: Difficulty
  levelNumber: number
  gridSize: number
  colorsByCell: number[]
  nextLevelNumber: number | null
}

/** The editor additionally renders the title and the authored solution. */
export type LevelAdminRecord = LevelPublicRecord & {
  title: string
  cowsByCell: boolean[]
}
