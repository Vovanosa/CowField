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

export type LevelDefinition = LevelSummary & {
  pensByCell: number[]
  hasNextLevel: boolean
}

export type LevelEditorDefinition = LevelDefinition & {
  cowsByCell: boolean[]
}

export type LevelDraft = Omit<LevelEditorDefinition, 'id' | 'createdAt' | 'updatedAt' | 'hasNextLevel'>
