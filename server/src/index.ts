import 'dotenv/config'

import { createApp } from './app'
import { enforceConfiguredAdminAccount, getConfiguredAdminEmail } from './auth/adminAccount'
import { getDatabaseUrl } from './db/config'
import { getPrismaClient } from './db/prismaClient'
import { createRepositories } from './repositories/createRepositories'

const PORT = Number.parseInt(process.env.PORT ?? '4000', 10)

async function startServer() {
  const databaseUrl = new URL(getDatabaseUrl())
  const app = createApp()

  await getPrismaClient().$connect()
  await getPrismaClient().$queryRaw`SELECT 1`

  // Once, at startup — not on every login. See enforceConfiguredAdminAccount.
  await enforceConfiguredAdminAccount(
    createRepositories().userRepository,
    getConfiguredAdminEmail(),
  )

  app.listen(PORT, () => {
    console.log(
      `Level API listening on http://localhost:${PORT} using database ${databaseUrl.hostname}:${databaseUrl.port || '5432'}/${databaseUrl.pathname.slice(1)}`,
    )
  })
}

void startServer().catch((error: unknown) => {
  console.error('Failed to start Level API in database mode.')
  console.error(error)
  process.exit(1)
})
