function requireEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getDatabaseUrl() {
  return requireEnvironmentVariable('DATABASE_URL')
}
