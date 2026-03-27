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

  async delete(difficulty: AppDifficulty, levelNumber: number) {
    const deleted = await this.prisma.level.deleteMany({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
        levelNumber,
      },
    })

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
