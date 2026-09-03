import { HttpError } from '../errors/HttpError'
import type { LevelRecordInput } from '../schemas/levelSchemas'
import { validateLevelRecord } from './levelValidation'
import type { LevelRepository } from '../repositories/interfaces'
import type { LevelAdminRecord, LevelPublicRecord } from '../types/level'

export class LevelService {
  private readonly repository: LevelRepository

  constructor(repository: LevelRepository) {
    this.repository = repository
  }

  async getDifficultySummary(difficulty: LevelRecordInput['difficulty']) {
    return this.repository.getDifficultySummary(difficulty)
  }

  async getOverview() {
    return this.repository.getOverview()
  }

  async listByDifficulty(difficulty: LevelRecordInput['difficulty']) {
    return this.repository.listByDifficulty(difficulty)
  }

  async listPageByDifficulty(
    difficulty: LevelRecordInput['difficulty'],
    page: number,
    limit: number,
  ) {
    return this.repository.listByDifficulty(difficulty, { page, limit })
  }

  async getByDifficultyAndNumber(
    difficulty: LevelRecordInput['difficulty'],
    levelNumber: number,
    includeAuthoringData = false,
  ) {
    const [level, difficultySummary] = await Promise.all([
      this.repository.getByDifficultyAndNumber(difficulty, levelNumber),
      this.repository.getDifficultySummary(difficulty),
    ])

    if (!level) {
      throw new HttpError(404, 'Level not found.')
    }

    const hasNextLevel =
      difficultySummary.highestLevelNumber !== null &&
      difficultySummary.highestLevelNumber > levelNumber

    if (includeAuthoringData) {
      return {
        ...level,
        hasNextLevel,
      } satisfies LevelAdminRecord
    }

    // `cowsByCell` is the authored solution. It must never reach a non-admin caller, and stripping
    // it has to happen at runtime — `satisfies LevelPublicRecord` below does not remove properties
    // that arrive through a spread, so the type alone is not a guarantee.
    const { cowsByCell, ...publicLevel } = level
    void cowsByCell

    return {
      ...publicLevel,
      hasNextLevel,
    } satisfies LevelPublicRecord
  }

  async save(input: LevelRecordInput, createdByActorKey?: string) {
    const validation = validateLevelRecord(input)

    if (!validation.isValid) {
      throw new HttpError(400, validation.issues.join(' '))
    }

    const existing = await this.repository.getByDifficultyAndNumber(
      input.difficulty,
      input.levelNumber,
    )
    const timestamp = new Date().toISOString()

    return this.repository.save(
      {
        ...input,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      },
      { createdByActorKey },
    )
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
