import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  passwordResetTokenRecordSchema,
  type PasswordResetTokenRecord,
} from '../types/auth'

const fileSchema = passwordResetTokenRecordSchema.array()

export class FilePasswordResetTokenRepository {
  private readonly rootDirectory: string

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory
  }

  private getFilePath() {
    return path.join(this.rootDirectory, 'password-reset-tokens.json')
  }

  private async readAll() {
    try {
      const rawFile = await readFile(this.getFilePath(), 'utf8')
      return fileSchema.parse(JSON.parse(rawFile))
    } catch {
      return []
    }
  }

  private async writeAll(records: PasswordResetTokenRecord[]) {
    await mkdir(this.rootDirectory, { recursive: true })
    await writeFile(this.getFilePath(), `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  }

  async save(record: PasswordResetTokenRecord) {
    const records = await this.readAll()
    const nextRecords = records.filter((item) => item.id !== record.id)
    nextRecords.push(record)
    await this.writeAll(nextRecords)
    return record
  }

  async getByToken(token: string) {
    const records = await this.readAll()
    return records.find((record) => record.token === token) ?? null
  }

  async deleteById(id: string) {
    const records = await this.readAll()
    const nextRecords = records.filter((record) => record.id !== id)
    await this.writeAll(nextRecords)
  }
}
