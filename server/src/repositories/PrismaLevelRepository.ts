import { Difficulty, type PrismaClient } from '@prisma/client'

import { DIFFICULTIES } from '../types/level'
import type {
  Difficulty as AppDifficulty,
  LevelDifficultySummaryRecord,
  LevelCatalogueRecord,
  LevelRecord,
  LevelsOverviewRecord,
} from '../types/level'
import type { LevelRepository } from './interfaces'
import { resolveActorReference } from './prismaActor'

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
      difficulties: DIFFICULTIES.map(
        (difficulty) => groupedByDifficulty.get(difficulty) ?? createEmptyLevelDifficultySummary(difficulty),
      ),
    }
  }

  /**
   * The whole catalogue for a difficulty.
   *
   * The `page`/`limit` path this used to carry is gone. Nothing ever passed the options: the client
   * fetched everything and then re-sliced it, and the levels page pages the grid itself from what it
   * already holds. Two of the three pagination implementations in the project were dead code.
   */
  async listByDifficulty(difficulty: AppDifficulty): Promise<LevelCatalogueRecord> {
    // `select: { levelNumber: true }` is the whole point — the level cards render a number and a
    // best time, so a row's title, grid size and timestamps never leave the database.
    const levels = await this.prisma.level.findMany({
      where: {
        difficulty: toPrismaDifficulty(difficulty),
      },
      select: {
        levelNumber: true,
      },
      orderBy: {
        levelNumber: 'asc',
      },
    })

    return {
      difficulty,
      levelNumbers: levels.map((level) => level.levelNumber),
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

  /**
   * The neighbours of a level in this difficulty's ordered list, in **one** query.
   *
   * `lte` / `gte` with `take: 2` means the level itself comes back as the first row of each side, so
   * existence and both neighbours fall out of the same two windows. Neither neighbour is
   * `levelNumber ± 1` — deleting a level leaves a gap, and both unlock order and the "Next Level"
   * button follow the list.
   */
  private async getNeighbourWindow(difficulty: AppDifficulty, levelNumber: number) {
    const [atOrBefore, atOrAfter] = await Promise.all([
      this.prisma.level.findMany({
        where: {
          difficulty: toPrismaDifficulty(difficulty),
          levelNumber: { lte: levelNumber },
        },
        orderBy: { levelNumber: 'desc' },
        take: 2,
        select: { levelNumber: true },
      }),
      this.prisma.level.findFirst({
        where: {
          difficulty: toPrismaDifficulty(difficulty),
          levelNumber: { gt: levelNumber },
        },
        orderBy: { levelNumber: 'asc' },
        select: { levelNumber: true },
      }),
    ])

    const exists = atOrBefore[0]?.levelNumber === levelNumber

    return {
      exists,
      previousLevelNumber: exists ? (atOrBefore[1]?.levelNumber ?? null) : null,
      nextLevelNumber: atOrAfter?.levelNumber ?? null,
    }
  }

  async getNeighbourLevelNumbers(difficulty: AppDifficulty, levelNumber: number) {
    return this.getNeighbourWindow(difficulty, levelNumber)
  }

  /**
   * The board and its neighbours.
   *
   * Replaces a `findUnique` plus `getDifficultySummary`'s `count()` + `findFirst()` — three queries
   * to produce a `hasNextLevel` **boolean**, which then made the client guess `levelNumber + 1`.
   */
  async getByDifficultyAndNumberWithNeighbours(difficulty: AppDifficulty, levelNumber: number) {
    const [level, neighbours] = await Promise.all([
      this.getByDifficultyAndNumber(difficulty, levelNumber),
      this.getNeighbourWindow(difficulty, levelNumber),
    ])

    return {
      level,
      previousLevelNumber: neighbours.previousLevelNumber,
      nextLevelNumber: neighbours.nextLevelNumber,
    }
  }

  async save(level: LevelRecord, options: { createdByActorKey?: string } = {}) {
    // Only guests have no user row, and they can never reach level authoring; resolving here keeps
    // the actor-key format out of the service layer.
    const author = options.createdByActorKey
      ? await resolveActorReference(this.prisma, options.createdByActorKey)
      : null

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
        // Authorship is set once, on create, and deliberately absent from `update` above.
        createdByUserId: author?.userId ?? null,
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
}
