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

  /**
   * A level's board, plus **which** level comes next.
   *
   * This used to answer a `hasNextLevel` boolean computed from `getDifficultySummary` — a `count()`
   * and a `findFirst()`, two queries to produce one bit. And a bit was not enough: the client then
   * assumed the next level was `levelNumber + 1`, so deleting a level from the middle of a
   * difficulty left an enabled "Next Level" button pointing at a level that does not exist.
   */
  async getByDifficultyAndNumber(
    difficulty: LevelRecordInput['difficulty'],
    levelNumber: number,
    includeAuthoringData = false,
  ) {
    const { level, nextLevelNumber } =
      await this.repository.getByDifficultyAndNumberWithNeighbours(difficulty, levelNumber)

    if (!level) {
      throw new HttpError(404, 'Level not found.')
    }

    // Built field by field, never by spreading the row. `cowsByCell` is the authored solution and
    // must never reach a non-admin, and a spread would carry it — plus `title`, `createdAt` and
    // `updatedAt`, none of which any screen renders during play. `satisfies` does not remove
    // properties that arrive through a spread, so the type alone would not have been a guarantee.
    const publicLevel: LevelPublicRecord = {
      difficulty: level.difficulty,
      levelNumber: level.levelNumber,
      gridSize: level.gridSize,
      colorsByCell: level.colorsByCell,
      nextLevelNumber,
    }

    if (!includeAuthoringData) {
      return publicLevel
    }

    // The editor is the one place a title and the authored solution are shown.
    return {
      ...publicLevel,
      title: level.title,
      cowsByCell: level.cowsByCell,
    } satisfies LevelAdminRecord
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

    const level = await this.repository.save(
      {
        ...input,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      },
      { createdByActorKey },
    )

    // The same shape `getByDifficultyAndNumber` returns for an admin, so the editor can seed its
    // cache from the response instead of reading the level back. A save can create a level, so the
    // neighbours are resolved *after* the write.
    const { nextLevelNumber } = await this.repository.getNeighbourLevelNumbers(
      input.difficulty,
      input.levelNumber,
    )

    return {
      difficulty: level.difficulty,
      levelNumber: level.levelNumber,
      gridSize: level.gridSize,
      colorsByCell: level.colorsByCell,
      nextLevelNumber,
      title: level.title,
      cowsByCell: level.cowsByCell,
    } satisfies LevelAdminRecord
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
