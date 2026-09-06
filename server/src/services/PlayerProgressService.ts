import { HttpError } from '../errors/HttpError'
import type { CompleteLevelInput } from '../schemas/progressSchemas'
import type { Difficulty } from '../types/level'
import type {
  LevelRepository,
  PlayerProgressRepository,
} from '../repositories/interfaces'
import type { ProgressOverviewRecord } from '../types/progress'

// The "no progress recorded yet" placeholder used to be synthesised here, for
// `GET /api/progress/:difficulty/:levelNumber`. That endpoint is gone: the client holds the whole
// collection for a difficulty and a lookup miss *is* the placeholder. See
// `src/game/storage/resources/progress.ts`.

export class PlayerProgressService {
  private readonly repository: PlayerProgressRepository
  private readonly levelRepository: LevelRepository

  constructor(repository: PlayerProgressRepository, levelRepository: LevelRepository) {
    this.repository = repository
    this.levelRepository = levelRepository
  }

  /**
   * Two queries, down from five: one `groupBy` over levels and one over the player's progress.
   * This used to fan out a separate count per difficulty.
   */
  async getOverview(actorKey: string): Promise<ProgressOverviewRecord> {
    const [levelsOverview, progressSummaries] = await Promise.all([
      this.levelRepository.getOverview(),
      this.repository.getDifficultySummaries(actorKey),
    ])

    const progressByDifficulty = new Map(
      progressSummaries.map((summary) => [summary.difficulty, summary.completedCount]),
    )

    return {
      difficulties: levelsOverview.difficulties.map((summary) => ({
        difficulty: summary.difficulty,
        totalCount: summary.totalCount,
        completedCount: progressByDifficulty.get(summary.difficulty) ?? 0,
      })),
    }
  }

  async getBestTimesByDifficulty(actorKey: string, difficulty: Difficulty) {
    return this.repository.getBestTimesByDifficulty(actorKey, difficulty)
  }

  /**
   * Records a completion.
   *
   * **Three queries**, down from six across two requests: the level's neighbours, this level's and
   * the previous level's progress together, and one transactional write covering the progress row
   * and both lifetime counters.
   *
   * The unlock check is not a formality — the client enforces order too
   * (`src/game/progression.ts`), but that is a UX affordance and this endpoint is reachable
   * directly. Guests never arrive here: the route is behind `createRequireNonGuestMiddleware`,
   * because they hold no backend rows for any of this to read or write.
   */
  async completeLevel(
    actorKey: string,
    difficulty: Difficulty,
    levelNumber: number,
    input: CompleteLevelInput,
  ) {
    const { exists, previousLevelNumber } = await this.levelRepository.getNeighbourLevelNumbers(
      difficulty,
      levelNumber,
    )

    if (!exists) {
      throw new HttpError(404, 'Level not found.')
    }

    // One query for both rows. The guard needs the previous level's, the write needs this level's,
    // and they used to be a `findFirst` each.
    const relevantProgress = await this.repository.listByLevelNumbers(
      actorKey,
      difficulty,
      previousLevelNumber === null ? [levelNumber] : [previousLevelNumber, levelNumber],
    )

    if (previousLevelNumber !== null) {
      const previousProgress = relevantProgress.find(
        (row) => row.levelNumber === previousLevelNumber,
      )

      if (previousProgress?.bestTimeSeconds == null) {
        throw new HttpError(403, 'Finish the previous level first.')
      }
    }

    const existing = relevantProgress.find((row) => row.levelNumber === levelNumber)
    const timestamp = new Date().toISOString()
    const isNewBest =
      existing?.bestTimeSeconds === null ||
      existing?.bestTimeSeconds === undefined ||
      input.timeSeconds < existing.bestTimeSeconds

    const progress = await this.repository.saveCompletion(actorKey, {
      progress: {
        difficulty,
        levelNumber,
        bestTimeSeconds: isNewBest
          ? input.timeSeconds
          : (existing?.bestTimeSeconds ?? input.timeSeconds),
        completedAt: timestamp,
        updatedAt: timestamp,
      },
      // Time played, not best times: this run happened whether or not it beat the record, so it
      // counts.
      timeSeconds: input.timeSeconds,
      // Folded in from the client instead of arriving as a parallel `POST
      // /api/statistics/bull-placement`. That endpoint remains for the `pagehide` flush.
      bullPlacements: input.bullPlacements ?? 0,
    })

    return {
      progress,
      isNewBest,
    }
  }
}

