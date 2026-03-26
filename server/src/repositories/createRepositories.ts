import { getPrismaClient } from '../db/prismaClient'
import { PrismaLevelRepository } from './PrismaLevelRepository'
import { PrismaPlayerProgressRepository } from './PrismaPlayerProgressRepository'
import { PrismaPlayerStatisticsRepository } from './PrismaPlayerStatisticsRepository'
import { PrismaSessionRepository } from './PrismaSessionRepository'
import { PrismaUserRepository } from './PrismaUserRepository'
import type { AppRepositories } from './interfaces'

export function createRepositories(): AppRepositories {
  const prisma = getPrismaClient()

  return {
    levelRepository: new PrismaLevelRepository(prisma),
    playerProgressRepository: new PrismaPlayerProgressRepository(prisma),
    playerStatisticsRepository: new PrismaPlayerStatisticsRepository(prisma),
    sessionRepository: new PrismaSessionRepository(prisma),
    userRepository: new PrismaUserRepository(prisma),
  }
}
