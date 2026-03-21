import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Difficulty } from '../types/level'
import { levelProgressRecordSchema, type LevelProgressRecord } from '../types/progress'

const fileSchema = levelProgressRecordSchema.array()

export class FilePlayerProgressRepository {
  private readonly rootDirectory: string

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory
  }

  private getFilePath(actorKey: string) {
    return path.join(
      this.rootDirectory,
      'actors',
      this.toSafeActorDirectory(actorKey),
      'player-progress.json',
    )
  }

  private toSafeActorDirectory(actorKey: string) {
    return actorKey.replace(/[^a-zA-Z0-9_-]/g, '_')
  }

  private async readAll(actorKey: string) {
    try {
      const rawFile = await readFile(this.getFilePath(actorKey), 'utf8')
      return fileSchema.parse(JSON.parse(rawFile))
    } catch {
      return []
    }
  }

  private async writeAll(actorKey: string, records: LevelProgressRecord[]) {
    await mkdir(path.dirname(this.getFilePath(actorKey)), { recursive: true })
    await writeFile(this.getFilePath(actorKey), `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  }

  async listByDifficulty(actorKey: string, difficulty: Difficulty) {
    const records = await this.readAll(actorKey)
    return records
      .filter((record) => record.difficulty === difficulty)
      .sort((left, right) => left.levelNumber - right.levelNumber)
  }

  async listAll(actorKey: string) {
    const records = await this.readAll(actorKey)
    return records.sort((left, right) => {
      if (left.difficulty === right.difficulty) {
        return left.levelNumber - right.levelNumber
      }

      return left.difficulty.localeCompare(right.difficulty)
    })
  }

  async getByDifficultyAndNumber(actorKey: string, difficulty: Difficulty, levelNumber: number) {
    const records = await this.readAll(actorKey)
    return (
      records.find(
        (record) => record.difficulty === difficulty && record.levelNumber === levelNumber,
      ) ?? null
    )
  }

  async save(actorKey: string, progress: LevelProgressRecord) {
    const records = await this.readAll(actorKey)
    const nextRecords = records.filter(
      (record) =>
        !(record.difficulty === progress.difficulty && record.levelNumber === progress.levelNumber),
    )

    nextRecords.push(progress)
    nextRecords.sort((left, right) => {
      if (left.difficulty === right.difficulty) {
        return left.levelNumber - right.levelNumber
      }

      return left.difficulty.localeCompare(right.difficulty)
    })

    await this.writeAll(actorKey, nextRecords)
    return progress
  }
}
