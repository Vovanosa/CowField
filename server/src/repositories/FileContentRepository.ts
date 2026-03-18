import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { ContentKey, ContentRecord } from '../types/content'

export class FileContentRepository {
  private readonly rootDirectory: string

  constructor(rootDirectory: string) {
    this.rootDirectory = rootDirectory
  }

  private getContentFilePath(key: ContentKey) {
    return path.join(this.rootDirectory, `${key}.json`)
  }

  async getByKey(key: ContentKey) {
    const filePath = this.getContentFilePath(key)

    try {
      const rawFile = await readFile(filePath, 'utf8')
      return JSON.parse(rawFile) as ContentRecord
    } catch {
      return null
    }
  }

  async save(content: ContentRecord) {
    const filePath = this.getContentFilePath(content.key)

    await mkdir(this.rootDirectory, { recursive: true })
    await writeFile(filePath, `${JSON.stringify(content, null, 2)}\n`, 'utf8')

    return content
  }
}
