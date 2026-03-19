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

  private getFilePath() {
    return path.join(this.rootDirectory, 'player-progress.json')
  }

  private async readAll() {
    try {
      const rawFile = await readFile(this.getFilePath(), 'utf8')
      return fileSchema.parse(JSON.parse(rawFile))
    } catch {
      return []
    }
  }

  private async writeAll(records: LevelProgressRecord[]) {
    await mkdir(this.rootDirectory, { recursive: true })
    await writeFile(this.getFilePath(), `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  }

  async listByDifficulty(difficulty: Difficulty) {
    const records = await this.readAll()
    return records
      .filter((record) => record.difficulty === difficulty)
      .sort((left, right) => left.levelNumber - right.levelNumber)
  }

  async listAll() {
    const records = await this.readAll()
    return records.sort((left, right) => {
      if (left.difficulty === right.difficulty) {
        return left.levelNumber - right.levelNumber
      }

      return left.difficulty.localeCompare(right.difficulty)
    })
  }

  async getByDifficultyAndNumber(difficulty: Difficulty, levelNumber: number) {
    const records = await this.readAll()
    return (
      records.find(
        (record) => record.difficulty === difficulty && record.levelNumber === levelNumber,
      ) ?? null
    )
  }

  async save(progress: LevelProgressRecord) {
    const records = await this.readAll()
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

    await this.writeAll(nextRecords)
    return progress
  }
}
