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

  async getDifficultySummary(
    actorKey: string,
    difficulty: AppDifficulty,
  ): Promise<DifficultyProgressSummaryRecord> {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return {
        difficulty,
        completedCount: 0,
      }
    }

    const completedCount = await this.prisma.levelProgress.count({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        userId: actor.userId,
        bestTimeSeconds: {
          not: null,
        },
      },
    })

    return {
      difficulty,
      completedCount,
    }
  }

  /**
   * Completed counts for every difficulty in **one** query.
   *
   * Replaces four separate `getDifficultySummary` calls. The single-difficulty version above stays
   * for `GET /api/progress/:difficulty/summary`, which genuinely only wants one.
   */
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
   * number it belongs to. `distinct` on a sorted `findMany` returns the first row per difficulty,
   * which — ordered by time then level number — is exactly the fastest level, ties broken by the
   * lower number.
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
      this.prisma.levelProgress.findMany({
        where: completedFilter,
        orderBy: [{ difficulty: 'asc' }, { bestTimeSeconds: 'asc' }, { levelNumber: 'asc' }],
        distinct: ['difficulty'],
        select: {
          difficulty: true,
          levelNumber: true,
          bestTimeSeconds: true,
        },
      }),
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

  async listByDifficulty(actorKey: string, difficulty: AppDifficulty) {
    const actor = await resolveActorReference(this.prisma, actorKey)

    if (!actor.userId) {
      return []
    }

    const records = await this.prisma.levelProgress.findMany({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        userId: actor.userId,
      },
      orderBy: {
        levelNumber: 'asc',
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
}
