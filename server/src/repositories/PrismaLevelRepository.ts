import { Difficulty, type PrismaClient } from '@prisma/client'

import type {
  Difficulty as AppDifficulty,
  LevelDifficultySummaryRecord,
  LevelListPageRecord,
  LevelRecord,
  LevelSummaryRecord,
  LevelsOverviewRecord,
} from '../types/level'
import type { LevelRepository } from './interfaces'

function toPrismaDifficulty(difficulty: AppDifficulty): Difficulty {
  return difficulty as Difficulty
}

function toLevelRecord(level: {
  difficulty: Difficulty
  levelNumber: number
  title: string
  gridSize: number
  pensByCell: unknown
  cowsByCell: unknown
  createdAt: Date
  updatedAt: Date
}): LevelRecord {
  return {
    difficulty: level.difficulty,
    levelNumber: level.levelNumber,
    title: level.title,
    gridSize: level.gridSize,
    colorsByCell: level.pensByCell as number[],
    cowsByCell: level.cowsByCell as boolean[],
    createdAt: level.createdAt.toISOString(),
    updatedAt: level.updatedAt.toISOString(),
  }
}

function toLevelSummaryRecord(level: {
  difficulty: Difficulty
  levelNumber: number
  title: string
  gridSize: number
  createdAt: Date
  updatedAt: Date
}): LevelSummaryRecord {
  return {
    difficulty: level.difficulty,
    levelNumber: level.levelNumber,
    title: level.title,
    gridSize: level.gridSize,
    createdAt: level.createdAt.toISOString(),
    updatedAt: level.updatedAt.toISOString(),
  }
}

function createEmptyLevelDifficultySummary(difficulty: AppDifficulty): LevelDifficultySummaryRecord {
  return {
    difficulty,
    totalCount: 0,
    highestLevelNumber: null,
  }
}

export class PrismaLevelRepository implements LevelRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async getDifficultySummary(difficulty: AppDifficulty): Promise<LevelDifficultySummaryRecord> {
    const [totalCount, highestLevel] = await Promise.all([
      this.prisma.level.count({
        where: {
          difficulty: toPrismaDifficulty(difficulty),
        },
      }),
      this.prisma.level.findFirst({
        where: {
          difficulty: toPrismaDifficulty(difficulty),
        },
        orderBy: {
          levelNumber: 'desc',
        },
        select: {
          levelNumber: true,
        },
      }),
    ])

    return {
      difficulty,
      totalCount,
      highestLevelNumber: highestLevel?.levelNumber ?? null,
    }
  }

  async getOverview(): Promise<LevelsOverviewRecord> {
    const groups = await this.prisma.level.groupBy({
      by: ['difficulty'],
      _count: {
        _all: true,
      },
      _max: {
        levelNumber: true,
      },
    })

    const difficulties: AppDifficulty[] = ['light', 'easy', 'medium', 'hard']
    const groupedByDifficulty = new Map(
      groups.map((group) => [
        group.difficulty as AppDifficulty,
        {
          difficulty: group.difficulty as AppDifficulty,
          totalCount: group._count._all,
          highestLevelNumber: group._max.levelNumber ?? null,
        } satisfies LevelDifficultySummaryRecord,
      ]),
    )

    return {
      difficulties: difficulties.map(
        (difficulty) => groupedByDifficulty.get(difficulty) ?? createEmptyLevelDifficultySummary(difficulty),
      ),
    }
  }

  async listByDifficulty(
    difficulty: AppDifficulty,
    options?: {
      page?: number
      limit?: number
    },
  ): Promise<LevelListPageRecord> {
    const totalCount = await this.prisma.level.count({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
      },
    })

    const hasPagination = options?.page !== undefined && options?.limit !== undefined
    const page = hasPagination ? Math.max(options?.page ?? 1, 1) : 1
    const limit = hasPagination ? Math.max(options?.limit ?? 1, 1) : Math.max(totalCount, 1)
    const totalPages = hasPagination ? Math.max(Math.ceil(totalCount / limit), 1) : 1
    const normalizedPage = hasPagination ? Math.min(page, totalPages) : 1

    const levels = await this.prisma.level.findMany({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
      },
      select: {
        difficulty: true,
        levelNumber: true,
        title: true,
        gridSize: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        levelNumber: 'asc',
      },
      skip: hasPagination ? (normalizedPage - 1) * limit : undefined,
      take: hasPagination ? limit : undefined,
    })

    return {
      difficulty,
      levels: levels.map(toLevelSummaryRecord),
      totalCount,
      page: normalizedPage,
      limit,
      totalPages,
    }
  }

  async getByDifficultyAndNumber(difficulty: AppDifficulty, levelNumber: number) {
    const level = await this.prisma.level.findUnique({
      where: {
        difficulty_levelNumber: {
          difficulty: toPrismaDifficulty(difficulty),
          levelNumber,
        },
      },
    })

    return level ? toLevelRecord(level) : null
  }

  async getPreviousLevelNumber(difficulty: AppDifficulty, levelNumber: number) {
    const previousLevel = await this.prisma.level.findFirst({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        levelNumber: {
          lt: levelNumber,
        },
      },
      orderBy: {
        levelNumber: 'desc',
      },
      select: {
        levelNumber: true,
      },
    })

    return previousLevel?.levelNumber ?? null
  }

  async save(level: LevelRecord) {
    const savedLevel = await this.prisma.level.upsert({
      where: {
        difficulty_levelNumber: {
          difficulty: toPrismaDifficulty(level.difficulty),
          levelNumber: level.levelNumber,
        },
      },
      update: {
        title: level.title,
        gridSize: level.gridSize,
        pensByCell: level.colorsByCell,
        cowsByCell: level.cowsByCell,
        createdAt: new Date(level.createdAt),
        updatedAt: new Date(level.updatedAt),
      },
      create: {
        difficulty: toPrismaDifficulty(level.difficulty),
        levelNumber: level.levelNumber,
        title: level.title,
        gridSize: level.gridSize,
        pensByCell: level.colorsByCell,
        cowsByCell: level.cowsByCell,
        createdAt: new Date(level.createdAt),
        updatedAt: new Date(level.updatedAt),
      },
    })

    return toLevelRecord(savedLevel)
  }

  /**
   * All-or-nothing batch save. Used by `npm run levels:generate`, where a partially written batch
   * would leave the library in a state nobody asked for.
   *
   * Deleting the replaced levels' progress is part of the same transaction on purpose: the board
   * changing and its best times surviving must never be separable outcomes.
   */
  async saveMany(levels: LevelRecord[], options: { replacedLevelNumbers?: number[] } = {}) {
    if (levels.length === 0) {
      return { savedCount: 0, deletedProgressCount: 0 }
    }

    const replacedLevelNumbers = options.replacedLevelNumbers ?? []
    // Every level in a batch belongs to one difficulty; `save` is keyed on the pair either way.
    const difficulty = toPrismaDifficulty(levels[0].difficulty)

    return this.prisma.$transaction(
      async (transaction) => {
        let deletedProgressCount = 0

        if (replacedLevelNumbers.length > 0) {
          const deleted = await transaction.levelProgress.deleteMany({
            where: {
              difficulty,
              levelNumber: { in: replacedLevelNumbers },
            },
          })
          deletedProgressCount = deleted.count
        }

        for (const level of levels) {
          const values = {
            title: level.title,
            gridSize: level.gridSize,
            pensByCell: level.colorsByCell,
            cowsByCell: level.cowsByCell,
            createdAt: new Date(level.createdAt),
            updatedAt: new Date(level.updatedAt),
          }

          await transaction.level.upsert({
            where: {
              difficulty_levelNumber: {
                difficulty: toPrismaDifficulty(level.difficulty),
                levelNumber: level.levelNumber,
              },
            },
            update: values,
            create: {
              difficulty: toPrismaDifficulty(level.difficulty),
              levelNumber: level.levelNumber,
              ...values,
            },
          })
        }

        return { savedCount: levels.length, deletedProgressCount }
      },
      {
        // Prisma's default interactive-transaction timeout is 5s, which a 50-level batch against a
        // remote database can exceed — and it would fail *after* doing the work.
        timeout: 120_000,
        maxWait: 15_000,
      },
    )
  }

  async delete(difficulty: AppDifficulty, levelNumber: number) {
    // `level_progress` has no foreign key to `levels` — it identifies a level by
    // (difficulty, levelNumber). So the progress rows have to go with the level, in the same
    // transaction. Leaving them behind would keep them counting toward completion totals, and a
    // level later created at the same number would silently inherit the old best times.
    const [deleted] = await this.prisma.$transaction([
      this.prisma.level.deleteMany({
        where: {
          difficulty: toPrismaDifficulty(difficulty),
          levelNumber,
        },
      }),
      this.prisma.levelProgress.deleteMany({
        where: {
          difficulty: toPrismaDifficulty(difficulty),
          levelNumber,
        },
      }),
    ])

    return deleted.count > 0
  }

  async exists() {
    const level = await this.prisma.level.findFirst({
      select: {
        id: true,
      },
    })

    return Boolean(level)
  }
}
