import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Difficulty, LevelRecord } from '../types/level'

export class FileLevelRepository {
  private readonly rootDirectory: string

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory
  }

  private getDifficultyDirectory(difficulty: Difficulty) {
    return path.join(this.rootDirectory, difficulty)
  }

  private getLevelFilePath(difficulty: Difficulty, levelNumber: number) {
    return path.join(this.getDifficultyDirectory(difficulty), `${levelNumber}.json`)
  }

  async listByDifficulty(difficulty: Difficulty) {
    const directory = this.getDifficultyDirectory(difficulty)

    try {
      const entries = await readdir(directory, { withFileTypes: true })
      const levelNumbers = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => Number.parseInt(entry.name.replace(/\.json$/u, ''), 10))
        .filter((value) => Number.isInteger(value))
        .sort((left, right) => left - right)

      const levels = await Promise.all(
        levelNumbers.map((levelNumber) => this.getByDifficultyAndNumber(difficulty, levelNumber)),
      )

      return levels.filter((level): level is LevelRecord => level !== null)
    } catch {
      return []
    }
  }

  async getByDifficultyAndNumber(difficulty: Difficulty, levelNumber: number) {
    const filePath = this.getLevelFilePath(difficulty, levelNumber)

    try {
      const rawFile = await readFile(filePath, 'utf8')
      return JSON.parse(rawFile) as LevelRecord
    } catch {
      return null
    }
  }

  async save(level: LevelRecord) {
    const directory = this.getDifficultyDirectory(level.difficulty)
    const filePath = this.getLevelFilePath(level.difficulty, level.levelNumber)

    await mkdir(directory, { recursive: true })
    await writeFile(filePath, `${JSON.stringify(level, null, 2)}\n`, 'utf8')

    return level
  }

  async delete(difficulty: Difficulty, levelNumber: number) {
    const filePath = this.getLevelFilePath(difficulty, levelNumber)

    try {
      await rm(filePath)
      return true
    } catch {
      return false
    }
  }

  async getNextLevelNumber(difficulty: Difficulty) {
    const levels = await this.listByDifficulty(difficulty)
    const maxLevelNumber = levels.reduce(
      (currentMax, level) => Math.max(currentMax, level.levelNumber),
      0,
    )

    return maxLevelNumber + 1
  }

  async exists() {
    try {
      const info = await stat(this.rootDirectory)
      return info.isDirectory()
    } catch {
      return false
    }
  }
}
