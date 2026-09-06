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

  prismaClient = new PrismaClient({
    adapter,
    // Off unless asked for. `scripts/measure-session.mts` sets this so it can count real Postgres
    // round trips through `$on('query')` — which only fires when the log option is declared here,
    // and the scope document's query gate is meant to be re-measurable rather than re-derived by
    // reading the code. Emitting events costs nothing when nobody subscribes, but the flag keeps
    // production from carrying even that.
    ...(process.env.PRISMA_QUERY_LOG === '1'
      ? { log: [{ emit: 'event' as const, level: 'query' as const }] }
      : {}),
  })
  return prismaClient
}
