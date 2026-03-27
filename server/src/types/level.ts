import { z } from 'zod'

export const difficultySchema = z.enum(['light', 'easy', 'medium', 'hard'])

export type Difficulty = z.infer<typeof difficultySchema>

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
export type LevelListPageRecord = {
  difficulty: Difficulty
  levels: LevelSummaryRecord[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}
export type LevelPublicRecord = Omit<LevelRecord, 'cowsByCell'> & {
  hasNextLevel: boolean
}
export type LevelAdminRecord = LevelRecord & {
  hasNextLevel: boolean
}
