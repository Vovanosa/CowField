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

  private getFilePath(actorKey: string) {
    return path.join(
      this.rootDirectory,
      'actors',
      this.toSafeActorDirectory(actorKey),
      'player-statistics.json',
    )
  }

  private toSafeActorDirectory(actorKey: string) {
    return actorKey.replace(/[^a-zA-Z0-9_-]/g, '_')
  }

  async get(actorKey: string) {
    try {
      const rawFile = await readFile(this.getFilePath(actorKey), 'utf8')
      return playerStatisticsRecordSchema.parse(JSON.parse(rawFile))
    } catch {
      return createEmptyStatisticsRecord()
    }
  }

  async save(actorKey: string, record: PlayerStatisticsRecord) {
    await mkdir(path.dirname(this.getFilePath(actorKey)), { recursive: true })
    await writeFile(this.getFilePath(actorKey), `${JSON.stringify(record, null, 2)}\n`, 'utf8')
    return record
  }
}
