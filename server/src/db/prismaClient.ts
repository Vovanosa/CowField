import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { getDatabaseUrl } from './config'

let prismaClient: PrismaClient | null = null

export function getPrismaClient() {
  if (prismaClient) {
    return prismaClient
  }

  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
  })

  prismaClient = new PrismaClient({ adapter })
  return prismaClient
}
