import 'dotenv/config'

import { defineConfig } from 'prisma/config'

function getPrismaDatasourceUrl() {
  const directUrl = process.env.DIRECT_URL?.trim()

  if (directUrl) {
    return directUrl
  }

  const databaseUrl = process.env.DATABASE_URL?.trim()

  if (databaseUrl) {
    return databaseUrl
  }

  throw new Error('DATABASE_URL or DIRECT_URL must be set for Prisma CLI commands.')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: getPrismaDatasourceUrl(),
  },
})
