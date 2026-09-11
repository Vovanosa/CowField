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
   * Adopts a guest's locally-stored progress into the account they have just created.
   *
   * **This is a write taking client-supplied times, so it is validated like one.** Two rules do the
   * work, and both matter:
   *
   * - It can only ever write to **the calling account** — `actorKey` comes from the session, never
   *   from the body, so there is no shape of request that writes to someone else.
   * - It only accepts levels that **exist**. The payload is read out of a browser's own storage and
   *   could name anything; without this, an account could claim a best time on a level that was
   *   never authored, and every count derived from `level_progress` would be wrong.
   *
   * There is deliberately **no ordering check**, because P18 removed the concept — see
   * `completeLevel`. A guest who played level 40 and nothing before it imports exactly that.
   *
   * One query per distinct difficulty to learn which levels exist, then one transaction. This runs
   * at most once in an account's life.
   */
  async importGuestProgress(
    actorKey: string,
    entries: Array<{ difficulty: Difficulty; levelNumber: number; timeSeconds: number }>,
  ) {
    if (entries.length === 0) {
      return { importedCount: 0, skippedCount: 0 }
    }

    const difficulties = [...new Set(entries.map((entry) => entry.difficulty))]
    const catalogues = await Promise.all(
      difficulties.map((difficulty) => this.levelRepository.listByDifficulty(difficulty)),
    )
    const knownLevels = new Map(
      catalogues.map((catalogue) => [
        catalogue.difficulty,
        new Set(catalogue.levelNumbers),
      ]),
    )

    // Last one wins on a duplicate. The client sends a map, so duplicates should not arise; the
    // dedup is here because `createMany` would otherwise reject the whole batch on one.
    const deduped = new Map<string, (typeof entries)[number]>()

    for (const entry of entries) {
      if (knownLevels.get(entry.difficulty)?.has(entry.levelNumber)) {
        deduped.set(`${entry.difficulty}:${entry.levelNumber}`, entry)
      }
    }

    const accepted = [...deduped.values()]
    const { importedCount } = await this.repository.importCompletions(actorKey, accepted)

    return { importedCount, skippedCount: entries.length - accepted.length }
  }

  /**
   * Records a completion.
   *
   * **Three queries**: the level's neighbours, this level's progress row, and one transactional
   * write covering the progress row and both lifetime counters.
   *
   * **There is no ordering check.** Until P18 this threw `403 'Finish the previous level first.'`
   * when the preceding level had no recorded time, which is why it also read that level's row. Level
   * locking was removed across the product: any level in any difficulty is open immediately, so a
   * completion arriving out of order is now a legitimate request and not an attempt to skip
   * something. The consequence worth naming is that a run of completion rows no longer implies a
   * path through a difficulty.
   *
   * What still holds: the level must exist (404), and guests never arrive here — the route is behind
   * `createRequireNonGuestMiddleware`, because they hold no backend rows for any of this to read or
   * write.
   */
  async completeLevel(
    actorKey: string,
    difficulty: Difficulty,
    levelNumber: number,
    input: CompleteLevelInput,
  ) {
    // Only `exists` is wanted here, but `getNeighbourLevelNumbers` is one indexed window query and
    // `LevelService.save` needs the rest of it, so this stays one method rather than two.
    const { exists } = await this.levelRepository.getNeighbourLevelNumbers(difficulty, levelNumber)

    if (!exists) {
      throw new HttpError(404, 'Level not found.')
    }

    const relevantProgress = await this.repository.listByLevelNumbers(actorKey, difficulty, [
      levelNumber,
    ])

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

