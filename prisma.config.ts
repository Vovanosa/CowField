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

  return 'postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public'
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
