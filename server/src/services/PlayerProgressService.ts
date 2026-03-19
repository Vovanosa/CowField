import type { CompleteLevelInput } from '../schemas/progressSchemas'
import { FilePlayerProgressRepository } from '../repositories/FilePlayerProgressRepository'
import type { Difficulty } from '../types/level'

function createEmptyProgress(difficulty: Difficulty, levelNumber: number) {
  return {
    difficulty,
    levelNumber,
    bestTimeSeconds: null,
    completedAt: null,
    updatedAt: '',
  }
}

export class PlayerProgressService {
  private readonly repository: FilePlayerProgressRepository

  constructor(repository: FilePlayerProgressRepository) {
    this.repository = repository
  }

  async listByDifficulty(difficulty: Difficulty) {
    return this.repository.listByDifficulty(difficulty)
  }

  async getByDifficultyAndNumber(difficulty: Difficulty, levelNumber: number) {
    return (
      (await this.repository.getByDifficultyAndNumber(difficulty, levelNumber)) ??
      createEmptyProgress(difficulty, levelNumber)
    )
  }

  async completeLevel(
    difficulty: Difficulty,
    levelNumber: number,
    input: CompleteLevelInput,
  ) {
    const existing = await this.repository.getByDifficultyAndNumber(difficulty, levelNumber)
    const timestamp = new Date().toISOString()
    const isNewBest =
      existing?.bestTimeSeconds === null ||
      existing?.bestTimeSeconds === undefined ||
      input.timeSeconds < existing.bestTimeSeconds

    const progress = await this.repository.save({
      difficulty,
      levelNumber,
      bestTimeSeconds: isNewBest ? input.timeSeconds : (existing?.bestTimeSeconds ?? input.timeSeconds),
      completedAt: timestamp,
      updatedAt: timestamp,
    })

    return {
      progress,
      isNewBest,
    }
  }
}
