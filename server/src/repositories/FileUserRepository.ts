import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { userRecordSchema, type UserRecord } from '../types/auth'

const fileSchema = userRecordSchema.array()

export class FileUserRepository {
  private readonly rootDirectory: string

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory
  }

  private getFilePath() {
    return path.join(this.rootDirectory, 'users.json')
  }

  private async readAll() {
    try {
      const rawFile = await readFile(this.getFilePath(), 'utf8')
      return fileSchema.parse(JSON.parse(rawFile))
    } catch {
      return []
    }
  }

  private async writeAll(records: UserRecord[]) {
    await mkdir(this.rootDirectory, { recursive: true })
    await writeFile(this.getFilePath(), `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  }

  async listAll() {
    return this.readAll()
  }

  async getByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const records = await this.readAll()
    return records.find((record) => record.email === normalizedEmail) ?? null
  }

  async getById(id: string) {
    const records = await this.readAll()
    return records.find((record) => record.id === id) ?? null
  }

  async getByGoogleId(googleId: string) {
    const records = await this.readAll()
    return records.find((record) => record.googleId === googleId) ?? null
  }

  async save(user: UserRecord) {
    const records = await this.readAll()
    const nextRecords = records.filter((record) => record.id !== user.id)
    nextRecords.push(user)
    nextRecords.sort((left, right) => left.email.localeCompare(right.email))
    await this.writeAll(nextRecords)
    return user
  }
}
