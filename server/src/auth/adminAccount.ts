import { randomUUID } from 'node:crypto'

import { requireEnvironmentVariable } from '../db/config'
import type { UserRepository } from '../repositories/interfaces'
import type { UserRecord } from '../types/auth'

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

/**
 * The one account allowed to be `admin`. Required rather than defaulted: silently falling back to
 * some baked-in address would hand admin to whoever owns it.
 */
export function getConfiguredAdminEmail() {
  return normalizeEmail(requireEnvironmentVariable('BULLPEN_ADMIN_EMAIL'))
}

/**
 * Enforces the single-admin rule: the configured email is `admin`, nobody else is.
 *
 * Called once at startup, not per request — it reads every user row and may write, so it has no
 * business running on each login. Any role drift is corrected on the next restart.
 */
export async function enforceConfiguredAdminAccount(
  userRepository: UserRepository,
  adminEmail: string,
) {
  const normalizedAdminEmail = normalizeEmail(adminEmail)
  const timestamp = new Date().toISOString()
  const users = await userRepository.listAll()
  let configuredAdmin = users.find((user) => user.email === normalizedAdminEmail) ?? null

  if (!configuredAdmin) {
    // No password anywhere on the row: passwords live in Neon Auth, and the columns that used to
    // hold one are gone. The admin signs in through Neon like everyone else.
    configuredAdmin = {
      id: randomUUID(),
      email: normalizedAdminEmail,
      role: 'admin',
      displayName: 'Admin',
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies UserRecord

    await userRepository.save(configuredAdmin)
  } else if (configuredAdmin.role !== 'admin') {
    configuredAdmin = {
      ...configuredAdmin,
      role: 'admin',
      updatedAt: timestamp,
    }

    await userRepository.save(configuredAdmin)
  }

  for (const user of users) {
    if (user.email === normalizedAdminEmail || user.role !== 'admin') {
      continue
    }

    await userRepository.save({
      ...user,
      role: 'user',
      updatedAt: timestamp,
    })
  }

  return configuredAdmin
}
