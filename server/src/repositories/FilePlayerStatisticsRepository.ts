import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  playerStatisticsRecordSchema,
  type PlayerStatisticsRecord,
} from '../types/statistics'

function createEmptyStatisticsRecord(): PlayerStatisticsRecord {
  return {
    totalBullPlacements: 0,
    updatedAt: '',
  }
}

export class FilePlayerStatisticsRepository {
  private readonly rootDirectory: string

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory
  }

  private getFilePath() {
    return path.join(this.rootDirectory, 'player-statistics.json')
  }

  async get() {
    try {
      const rawFile = await readFile(this.getFilePath(), 'utf8')
      return playerStatisticsRecordSchema.parse(JSON.parse(rawFile))
    } catch {
      return createEmptyStatisticsRecord()
    }
  }

  async save(record: PlayerStatisticsRecord) {
    await mkdir(this.rootDirectory, { recursive: true })
    await writeFile(this.getFilePath(), `${JSON.stringify(record, null, 2)}\n`, 'utf8')
    return record
  }
}
