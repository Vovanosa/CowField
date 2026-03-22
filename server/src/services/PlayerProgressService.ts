import type { CompleteLevelInput } from '../schemas/progressSchemas'
import type { Difficulty } from '../types/level'
import type { PlayerProgressRepository } from '../repositories/interfaces'

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
  private readonly repository: PlayerProgressRepository

  constructor(repository: PlayerProgressRepository) {
    this.repository = repository
  }

  async listByDifficulty(actorKey: string, difficulty: Difficulty) {
    return this.repository.listByDifficulty(actorKey, difficulty)
  }

  async getByDifficultyAndNumber(actorKey: string, difficulty: Difficulty, levelNumber: number) {
    return (
      (await this.repository.getByDifficultyAndNumber(actorKey, difficulty, levelNumber)) ??
      createEmptyProgress(difficulty, levelNumber)
    )
  }

  async completeLevel(
    actorKey: string,
    difficulty: Difficulty,
    levelNumber: number,
    input: CompleteLevelInput,
  ) {
    const existing = await this.repository.getByDifficultyAndNumber(
      actorKey,
      difficulty,
      levelNumber,
    )
    const timestamp = new Date().toISOString()
    const isNewBest =
      existing?.bestTimeSeconds === null ||
      existing?.bestTimeSeconds === undefined ||
      input.timeSeconds < existing.bestTimeSeconds

    const progress = await this.repository.save(actorKey, {
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
