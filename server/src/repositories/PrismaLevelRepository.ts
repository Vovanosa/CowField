import { Difficulty, type PrismaClient } from '@prisma/client'

import type { Difficulty as AppDifficulty, LevelRecord, LevelSummaryRecord } from '../types/level'
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

export class PrismaLevelRepository implements LevelRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async listByDifficulty(difficulty: AppDifficulty) {
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
    })

    return levels.map(toLevelSummaryRecord)
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
