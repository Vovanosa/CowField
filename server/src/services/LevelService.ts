import { HttpError } from '../errors/HttpError'
import type { LevelRecordInput } from '../schemas/levelSchemas'
import { validateLevelRecord } from './levelValidation'
import type { LevelRepository } from '../repositories/interfaces'

export class LevelService {
  private readonly repository: LevelRepository

  constructor(repository: LevelRepository) {
    this.repository = repository
  }

  async listByDifficulty(difficulty: LevelRecordInput['difficulty']) {
    return this.repository.listByDifficulty(difficulty)
  }

  async getByDifficultyAndNumber(
    difficulty: LevelRecordInput['difficulty'],
    levelNumber: number,
  ) {
    const level = await this.repository.getByDifficultyAndNumber(difficulty, levelNumber)

    if (!level) {
      throw new HttpError(404, 'Level not found.')
    }

    return level
  }

  async getNextLevelNumber(difficulty: LevelRecordInput['difficulty']) {
    const nextLevelNumber = await this.repository.getNextLevelNumber(difficulty)

    return {
      difficulty,
      nextLevelNumber,
    }
  }

  async save(input: LevelRecordInput) {
    const validation = validateLevelRecord(input)

    if (!validation.isValid) {
      throw new HttpError(400, validation.issues.join(' '))
    }

    const existing = await this.repository.getByDifficultyAndNumber(
      input.difficulty,
      input.levelNumber,
    )
    const timestamp = new Date().toISOString()

    return this.repository.save({
      ...input,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })
  }

  async delete(difficulty: LevelRecordInput['difficulty'], levelNumber: number) {
    const deleted = await this.repository.delete(difficulty, levelNumber)

    if (!deleted) {
      throw new HttpError(404, 'Level not found.')
    }

    return {
      deleted: true,
    }
  }
}
