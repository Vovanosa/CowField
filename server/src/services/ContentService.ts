import { HttpError } from '../errors/HttpError'
import type { ContentRecordInput } from '../schemas/contentSchemas'
import type { ContentKey } from '../types/content'
import type { ContentRepository } from '../repositories/interfaces'

const defaultContentByKey: Record<ContentKey, string> = {
  home: 'Choose a difficulty to play, or switch to admin mode to create and edit levels.',
  about:
    'Bullpen is a calm logic puzzle about placing bulls so rows, columns, and colors satisfy the target without any bulls touching, even diagonally.',
  settings:
    'Settings stay minimal for now. Version one is focused on the puzzle flow, not preferences or account features.',
}

export class ContentService {
  private readonly repository: ContentRepository

  constructor(repository: ContentRepository) {
    this.repository = repository
  }

  async getByKey(key: ContentKey) {
    const content = await this.repository.getByKey(key)

    if (content) {
      return content
    }

    return {
      key,
      text: defaultContentByKey[key],
      updatedAt: '',
    }
  }

  async save(input: ContentRecordInput) {
    if (!input.text.trim()) {
      throw new HttpError(400, 'Content text cannot be empty.')
    }

    return this.repository.save({
      key: input.key,
      text: input.text.trim(),
      updatedAt: new Date().toISOString(),
    })
  }
}
