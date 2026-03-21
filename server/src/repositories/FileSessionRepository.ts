import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { sessionRecordSchema, type SessionRecord } from '../types/auth'

const fileSchema = sessionRecordSchema.array()

export class FileSessionRepository {
  private readonly rootDirectory: string

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory
  }

  private getFilePath() {
    return path.join(this.rootDirectory, 'auth-sessions.json')
  }

  private async readAll() {
    try {
      const rawFile = await readFile(this.getFilePath(), 'utf8')
      return fileSchema.parse(JSON.parse(rawFile))
    } catch {
      return []
    }
  }

  private async writeAll(records: SessionRecord[]) {
    await mkdir(this.rootDirectory, { recursive: true })
    await writeFile(this.getFilePath(), `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  }

  async getByToken(token: string) {
    const records = await this.readAll()
    return records.find((record) => record.token === token) ?? null
  }

  async save(session: SessionRecord) {
    const records = await this.readAll()
    const nextRecords = records.filter((record) => record.token !== session.token)
    nextRecords.push(session)
    await this.writeAll(nextRecords)
    return session
  }

  async deleteByToken(token: string) {
    const records = await this.readAll()
    const nextRecords = records.filter((record) => record.token !== token)
    await this.writeAll(nextRecords)
  }
}
