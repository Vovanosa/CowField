export type Difficulty = 'light' | 'easy' | 'medium' | 'hard'

export type LevelSummary = {
  id: string
  levelNumber: number
  title: string
  difficulty: Difficulty
  gridSize: number
  createdAt: string
  updatedAt: string
}

export type LevelDefinition = {
  id: string
  levelNumber: number
  title: string
  difficulty: Difficulty
  gridSize: number
  pensByCell: number[]
  cowsByCell: boolean[]
  createdAt: string
  updatedAt: string
}

export type LevelDraft = Omit<LevelDefinition, 'id' | 'createdAt' | 'updatedAt'>
