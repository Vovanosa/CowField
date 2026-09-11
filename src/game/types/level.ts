export type CellMark = 'empty' | 'dot' | 'bull'

export type Difficulty = 'light' | 'easy' | 'medium' | 'hard' | 'extreme'

/**
 * A playable board.
 *
 * Deliberately only what is rendered. There is no `title`, `createdAt`, `updatedAt` or `id` here:
 * the API stopped sending them, because no screen showed them. A React key is
 * `` `${difficulty}-${levelNumber}` ``, which the caller can build.
 */
export type LevelDefinition = {
  difficulty: Difficulty
  levelNumber: number
  gridSize: number
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

/** The editor additionally shows the title and the authored solution. Admins only. */
export type LevelEditorDefinition = LevelDefinition & {
  title: string
  cowsByCell: boolean[]
}

export type LevelDraft = Omit<LevelEditorDefinition, 'nextLevelNumber'>
