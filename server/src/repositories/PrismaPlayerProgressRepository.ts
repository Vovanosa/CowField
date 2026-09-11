import { Difficulty, type PrismaClient } from '@prisma/client'

import { DIFFICULTIES, type Difficulty as AppDifficulty } from '../types/level'
import type {
  DifficultyProgressSummaryRecord,
  LevelProgressRecord,
  ProgressStatisticsSummaries,
} from '../types/progress'
import type { DifficultyStatisticsSummary } from '../types/statistics'
import type { PlayerProgressRepository } from './interfaces'
import { resolveActorReference } from './prismaActor'

function toPrismaDifficulty(difficulty: AppDifficulty): Difficulty {
  return difficulty as Difficulty
}

/** One row of the `DISTINCT ON` read in `getStatisticsSummaries`. */
type FastestLevelRow = {
  difficulty: string
  levelNumber: number
  bestTimeSeconds: number | null
}

/** A difficulty the player has not completed anything in. `groupBy` omits those rows entirely. */
function createEmptyDifficultyStatisticsSummary(
  difficulty: AppDifficulty,
): DifficultyStatisticsSummary {
  return {
    difficulty,
    completedLevels: 0,
    fastestLevel: null,
    averageTimeSeconds: null,
  }
}

function toLevelProgressRecord(progress: {
  difficulty: Difficulty
  levelNumber: number
  bestTimeSeconds: number | null
  completedAt: Date | null
  updatedAt: Date
}): LevelProgressRecord {
  return {
    difficulty: progress.difficulty,
    levelNumber: progress.levelNumber,
    bestTimeSeconds: progress.bestTimeSeconds,
    completedAt: progress.completedAt?.toISOString() ?? null,
    updatedAt: progress.updatedAt.toISOString(),
  }
}

export class PrismaPlayerProgressRepository implements PlayerProgressRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /** Completed counts for every difficulty in **one** query. */
  async getDifficultySummaries(actorKey: string): Promise<DifficultyProgressSummaryRecord[]> {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return DIFFICULTIES.map((difficulty) => ({ difficulty, completedCount: 0 }))
    }

    const groups = await this.prisma.levelProgress.groupBy({
      by: ['difficulty'],
      where: {
        userId: actor.userId,
        bestTimeSeconds: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
    })

    const countByDifficulty = new Map(
      groups.map((group) => [group.difficulty as AppDifficulty, group._count._all]),
    )

    // Rebuilt from `DIFFICULTIES` rather than returned as-is: `groupBy` omits a difficulty the
    // player has never completed, and every caller expects all four present.
    return DIFFICULTIES.map((difficulty) => ({
      difficulty,
      completedCount: countByDifficulty.get(difficulty) ?? 0,
    }))
  }

  /**
   * Everything the statistics page needs from `level_progress`, in **two** queries.
   *
   * This replaces `getOverallStatisticsSummary` plus four `getDifficultyStatisticsSummary` calls —
   * nine queries, since each of those four did an `aggregate` *and* a `findFirst`. The overall
   * completed count comes out of the same `groupBy` as the per-difficulty ones, so it costs nothing
   * extra.
   *
   * The second query exists because `groupBy` can give the *minimum* best time but not the level
   * number it belongs to. `DISTINCT ON (difficulty)` over a sorted read returns the first row per
   * difficulty, which — ordered by time then level number — is exactly the fastest level, ties
   * broken by the lower number.
   *
   * **It is raw SQL because Prisma's `distinct` never reaches the database.** Measured 2026-09-06
   * against Prisma 7.5 by capturing the compiled SQL with a stub driver adapter: the statement
   * emitted for `findMany({ distinct: ['difficulty'] })` is byte-identical to the one emitted
   * without it. The filtering happens in the client, so this read was fetching **every completed
   * row** — up to 800 for a player who has finished the library — to return four. See plan.md item
   * 74. The datasource is hard-wired to postgresql, so `DISTINCT ON` is safe to depend on.
   */
  async getStatisticsSummaries(actorKey: string): Promise<ProgressStatisticsSummaries> {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return {
        totalCompletedLevels: 0,
        byDifficulty: DIFFICULTIES.map(createEmptyDifficultyStatisticsSummary),
      }
    }

    const completedFilter = {
      userId: actor.userId,
      bestTimeSeconds: {
        not: null,
      },
    }

    const [groups, fastestRows] = await Promise.all([
      this.prisma.levelProgress.groupBy({
        by: ['difficulty'],
        where: completedFilter,
        _count: {
          _all: true,
        },
        _avg: {
          bestTimeSeconds: true,
        },
      }),
      // `user_id` is TEXT, not uuid — Prisma maps `String` to TEXT — so the parameter goes in
      // uncast. The schema is spelled out because every statement Prisma itself compiles for this
      // datasource is qualified the same way.
      this.prisma.$queryRaw<FastestLevelRow[]>`
        SELECT DISTINCT ON ("difficulty")
          "difficulty"::text AS "difficulty",
          "level_number" AS "levelNumber",
          "best_time_seconds" AS "bestTimeSeconds"
        FROM "public"."level_progress"
        WHERE "user_id" = ${actor.userId}
          AND "best_time_seconds" IS NOT NULL
        ORDER BY "difficulty" ASC, "best_time_seconds" ASC, "level_number" ASC
      `,
    ])

    const groupByDifficulty = new Map(groups.map((group) => [group.difficulty as AppDifficulty, group]))
    const fastestByDifficulty = new Map(
      fastestRows.map((row) => [row.difficulty as AppDifficulty, row]),
    )

    const byDifficulty = DIFFICULTIES.map((difficulty) => {
      const group = groupByDifficulty.get(difficulty)

      if (!group) {
        return createEmptyDifficultyStatisticsSummary(difficulty)
      }

      const completedLevels = group._count._all
      const fastest = fastestByDifficulty.get(difficulty)

      return {
        difficulty,
        completedLevels,
        fastestLevel:
          fastest && fastest.bestTimeSeconds !== null
            ? {
                levelNumber: fastest.levelNumber,
                timeSeconds: fastest.bestTimeSeconds,
              }
            : null,
        averageTimeSeconds:
          completedLevels > 0 && group._avg.bestTimeSeconds !== null
            ? Math.round(group._avg.bestTimeSeconds)
            : null,
      } satisfies DifficultyStatisticsSummary
    })

    return {
      totalCompletedLevels: byDifficulty.reduce(
        (total, summary) => total + summary.completedLevels,
        0,
      ),
      byDifficulty,
    }
  }

  /**
   * A difficulty's best times, keyed by level number.
   *
   * Only completed rows, and only the two columns anything renders. This used to select whole rows
   * and hand back a full record each — the difficulty repeated per row, plus `completedAt` and
   * `updatedAt`, which no screen reads.
   */
  async getBestTimesByDifficulty(actorKey: string, difficulty: AppDifficulty) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return {}
    }

    const records = await this.prisma.levelProgress.findMany({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        userId: actor.userId,
        bestTimeSeconds: {
          not: null,
        },
      },
      select: {
        levelNumber: true,
        bestTimeSeconds: true,
      },
      orderBy: {
        levelNumber: 'asc',
      },
    })

    const bestTimes: Record<number, number> = {}

    for (const record of records) {
      if (record.bestTimeSeconds !== null) {
        bestTimes[record.levelNumber] = record.bestTimeSeconds
      }
    }

    return bestTimes
  }

  async listByLevelNumbers(
    actorKey: string,
    difficulty: AppDifficulty,
    levelNumbers: number[],
  ) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId || levelNumbers.length === 0) {
      return []
    }

    const records = await this.prisma.levelProgress.findMany({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        userId: actor.userId,
        levelNumber: {
          in: levelNumbers,
        },
      },
    })

    return records.map(toLevelProgressRecord)
  }

  async getByDifficultyAndNumber(actorKey: string, difficulty: AppDifficulty, levelNumber: number) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return null
    }

    const record = await this.prisma.levelProgress.findFirst({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        levelNumber,
        userId: actor.userId,
      },
    })

    return record ? toLevelProgressRecord(record) : null
  }

  async save(actorKey: string, progress: LevelProgressRecord) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return progress
    }

    // A write always stamps its own time. `progress.updatedAt` is the caller's idea of when it last
    // changed and can legitimately be null (nothing recorded yet), so it is not a value to persist.
    const writtenAt = new Date()

    const savedRecord = await this.prisma.levelProgress.upsert({
      where: {
        userId_difficulty_levelNumber: {
          userId: actor.userId,
          difficulty: toPrismaDifficulty(progress.difficulty),
          levelNumber: progress.levelNumber,
        },
      },
      update: {
        actorType: actor.actorType,
        userId: actor.userId,
        bestTimeSeconds: progress.bestTimeSeconds,
        completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
        updatedAt: writtenAt,
      },
      create: {
        actorType: actor.actorType,
        userId: actor.userId,
        difficulty: toPrismaDifficulty(progress.difficulty),
        levelNumber: progress.levelNumber,
        bestTimeSeconds: progress.bestTimeSeconds,
        completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
        updatedAt: writtenAt,
      },
    })

    return toLevelProgressRecord(savedRecord)
  }

  /**
   * The progress row and both lifetime counters, in one transaction and one round trip.
   *
   * `$transaction([...])` rather than the interactive form on purpose: the two statements do not
   * depend on each other's results, so the array form sends them as a single batch — atomic, and
   * without the extra `BEGIN`/`COMMIT` round trips an interactive transaction costs.
   *
   * This replaces three writes spread across two HTTP requests, with nothing tying them together.
   */
  async saveCompletion(
    actorKey: string,
    completion: {
      progress: LevelProgressRecord
      timeSeconds: number
      bullPlacements: number
    },
  ) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return completion.progress
    }

    const { progress, timeSeconds, bullPlacements } = completion
    const writtenAt = new Date()

    const [savedRecord] = await this.prisma.$transaction([
      this.prisma.levelProgress.upsert({
        where: {
          userId_difficulty_levelNumber: {
            userId: actor.userId,
            difficulty: toPrismaDifficulty(progress.difficulty),
            levelNumber: progress.levelNumber,
          },
        },
        update: {
          actorType: actor.actorType,
          userId: actor.userId,
          bestTimeSeconds: progress.bestTimeSeconds,
          completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
          updatedAt: writtenAt,
        },
        create: {
          actorType: actor.actorType,
          userId: actor.userId,
          difficulty: toPrismaDifficulty(progress.difficulty),
          levelNumber: progress.levelNumber,
          bestTimeSeconds: progress.bestTimeSeconds,
          completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
          updatedAt: writtenAt,
        },
      }),
      // Both counters in one upsert. They were two, each resolving the same actor and touching the
      // same row. `increment` rather than read-modify-write, so concurrent completions cannot lose
      // one another's contribution.
      this.prisma.playerStatisticsTotal.upsert({
        where: { userId: actor.userId },
        update: {
          totalCompletionTimeSeconds: { increment: timeSeconds },
          ...(bullPlacements > 0 ? { totalBullPlacements: { increment: bullPlacements } } : {}),
        },
        create: {
          actorType: actor.actorType,
          userId: actor.userId,
          totalCompletionTimeSeconds: timeSeconds,
          totalBullPlacements: bullPlacements,
        },
      }),
    ])

    return toLevelProgressRecord(savedRecord)
  }

  /**
   * A guest's whole local record, written in **one** transaction at the moment they create an
   * account.
   *
   * **Not a loop over `saveCompletion`.** That would be one round trip and one transaction per
   * level — up to a thousand of each — and a failure part-way through would leave an account holding
   * some of their history and no way to tell which part was missing.
   *
   * Existing rows are read first so the merge can keep the **better** time rather than the newer
   * one. Decision D5 only ever runs this on a brand-new account, where that read finds nothing; it
   * exists so the method is still correct if that ever changes, because "import overwrote my real
   * best time with a worse one from a guest session" is not a recoverable mistake.
   *
   * `totalCompletionTimeSeconds` moves by the sum. Those are real seconds the player spent, and the
   * per-entry bounds in `importProgressInputSchema` are the same ones every completion already
   * passes, so this adds no trust that was not already being extended.
   */
  async importCompletions(
    actorKey: string,
    entries: Array<{ difficulty: AppDifficulty; levelNumber: number; timeSeconds: number }>,
  ) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId || entries.length === 0) {
      return { importedCount: 0 }
    }

    const existingRows = await this.prisma.levelProgress.findMany({
      where: { userId: actor.userId },
      select: { difficulty: true, levelNumber: true, bestTimeSeconds: true },
    })
    const existingByKey = new Map(
      existingRows.map((row) => [`${row.difficulty}:${row.levelNumber}`, row.bestTimeSeconds]),
    )

    const writtenAt = new Date()
    const rowsToCreate: Array<{
      actorType: typeof actor.actorType
      userId: string
      difficulty: Difficulty
      levelNumber: number
      bestTimeSeconds: number
      completedAt: Date
      updatedAt: Date
    }> = []
    const rowsToImprove: Array<{ difficulty: AppDifficulty; levelNumber: number; timeSeconds: number }> = []

    for (const entry of entries) {
      const existingBest = existingByKey.get(`${entry.difficulty}:${entry.levelNumber}`)

      if (existingBest === undefined) {
        rowsToCreate.push({
          actorType: actor.actorType,
          userId: actor.userId,
          difficulty: toPrismaDifficulty(entry.difficulty),
          levelNumber: entry.levelNumber,
          bestTimeSeconds: entry.timeSeconds,
          completedAt: writtenAt,
          updatedAt: writtenAt,
        })
        continue
      }

      if (existingBest === null || entry.timeSeconds < existingBest) {
        rowsToImprove.push(entry)
      }
    }

    const totalSeconds = entries.reduce((total, entry) => total + entry.timeSeconds, 0)

    await this.prisma.$transaction([
      this.prisma.levelProgress.createMany({ data: rowsToCreate, skipDuplicates: true }),
      ...rowsToImprove.map((entry) =>
        this.prisma.levelProgress.update({
          where: {
            userId_difficulty_levelNumber: {
              userId: actor.userId as string,
              difficulty: toPrismaDifficulty(entry.difficulty),
              levelNumber: entry.levelNumber,
            },
          },
          data: { bestTimeSeconds: entry.timeSeconds, updatedAt: writtenAt },
        }),
      ),
      this.prisma.playerStatisticsTotal.upsert({
        where: { userId: actor.userId },
        update: { totalCompletionTimeSeconds: { increment: totalSeconds } },
        create: {
          actorType: actor.actorType,
          userId: actor.userId,
          totalCompletionTimeSeconds: totalSeconds,
          totalBullPlacements: 0,
        },
      }),
    ])

    return { importedCount: rowsToCreate.length + rowsToImprove.length }
  }
}
