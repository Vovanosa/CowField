import { randomBytes, randomUUID, scrypt as nodeScrypt } from 'node:crypto'
import { promisify } from 'node:util'

import type { UserRepository } from '../repositories/interfaces'
import type { UserRecord } from '../types/auth'

const scrypt = promisify(nodeScrypt)

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

export async function enforceConfiguredAdminAccount(
  userRepository: UserRepository,
  adminEmail: string,
  defaultPassword: string,
) {
  const normalizedAdminEmail = normalizeEmail(adminEmail)
  const timestamp = new Date().toISOString()
  const users = await userRepository.listAll()
  let configuredAdmin = users.find((user) => user.email === normalizedAdminEmail) ?? null

  if (!configuredAdmin) {
    configuredAdmin = {
      id: randomUUID(),
      email: normalizedAdminEmail,
      passwordHash: await hashPassword(defaultPassword),
      googleId: null,
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
