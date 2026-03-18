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
