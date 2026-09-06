export type CellMark = 'empty' | 'dot' | 'bull'

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
  /**
   * The next level in this difficulty, or null when this is the last one.
   *
   * Was a `hasNextLevel` boolean, which cost the server a count() plus a findFirst() to compute and
   * told the client nothing about *which* level was next — so "Next Level" navigated to
   * `levelNumber + 1` and dead-ended on the gap a deleted level leaves behind.
   */
  nextLevelNumber: number | null
}

export type LevelEditorDefinition = LevelDefinition & {
  cowsByCell: boolean[]
}

export type LevelDraft = Omit<
  LevelEditorDefinition,
  'id' | 'createdAt' | 'updatedAt' | 'nextLevelNumber'
>
