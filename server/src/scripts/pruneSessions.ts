import 'dotenv/config'

import { getPrismaClient } from '../db/prismaClient'
import { PrismaSessionRepository } from '../repositories/PrismaSessionRepository'

/**
 * Deletes every session row already past its `expires_at`.
 *
 * `getByToken` cleans up a session when someone next presents that token, but a token nobody ever
 * uses again — the common case, since every guest entry and every login mints one — would leave its
 * row behind forever. This is the bulk sweep. Run it whenever, by hand or from a scheduler; it is
 * idempotent and only ever deletes rows that could no longer authenticate anyway.
 *
 *   npx tsx server/src/scripts/pruneSessions.ts            # delete them
 *   npx tsx server/src/scripts/pruneSessions.ts --dry-run   # just report
 *
 * TTLs are in `server/src/auth/sessionExpiry.ts`.
 */
const isDryRun = process.argv.slice(2).includes('--dry-run')

async function main() {
  const prisma = getPrismaClient()
  const repository = new PrismaSessionRepository(prisma)
  const now = new Date()

  const [total, expiredByRole] = await Promise.all([
    prisma.session.count(),
    prisma.session.groupBy({
      by: ['role'],
      where: {
        expiresAt: {
          lte: now,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ])

  const expired = expiredByRole.reduce((sum, group) => sum + group._count._all, 0)

  console.log(`sessions: ${total}`)
  console.log(`expired as of ${now.toISOString()}: ${expired}`)

  for (const group of expiredByRole) {
    console.log(`  ${group.role}: ${group._count._all}`)
  }

  if (expired === 0) {
    console.log('\nNothing to prune.')
    return
  }

  if (isDryRun) {
    console.log(`\nDry run — nothing deleted. Re-run without --dry-run to remove ${expired} row(s).`)
    return
  }

  const deleted = await repository.deleteExpired(now)
  console.log(`\nDeleted ${deleted} expired session(s). ${total - deleted} remaining.`)
}

main()
  .catch((error) => {
    console.error('Failed to prune sessions.')
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    void getPrismaClient().$disconnect()
  })
