import { z } from 'zod'

export const difficultySchema = z.enum(['light', 'easy', 'medium', 'hard'])

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

export type LevelSummaryRecord = Omit<LevelRecord, 'colorsByCell' | 'cowsByCell'>
export type LevelDifficultySummaryRecord = {
  difficulty: Difficulty
  totalCount: number
  highestLevelNumber: number | null
}
export type LevelsOverviewRecord = {
  difficulties: LevelDifficultySummaryRecord[]
}
/** The whole catalogue for a difficulty. No paging envelope: the list is the count. */
export type LevelListPageRecord = {
  difficulty: Difficulty
  levels: LevelSummaryRecord[]
  totalCount: number
}
/** The next level in this difficulty, or null when this is the last one. Was a boolean. */
export type LevelPublicRecord = Omit<LevelRecord, 'cowsByCell'> & {
  nextLevelNumber: number | null
}
export type LevelAdminRecord = LevelRecord & {
  nextLevelNumber: number | null
}
