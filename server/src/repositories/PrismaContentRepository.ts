import type { PrismaClient } from '@prisma/client'

import type { ContentRecord } from '../types/content'
import type { ContentRepository } from './interfaces'

function toContentRecord(content: {
  key: string
  text: string
  updatedAt: Date
}): ContentRecord {
  return {
    key: content.key as ContentRecord['key'],
    text: content.text,
    updatedAt: content.updatedAt.toISOString(),
  }
}

export class PrismaContentRepository implements ContentRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async getByKey(key: ContentRecord['key']) {
    const content = await this.prisma.contentEntry.findUnique({
      where: {
        key,
      },
    })

    return content ? toContentRecord(content) : null
  }

  async save(content: ContentRecord) {
    const savedContent = await this.prisma.contentEntry.upsert({
      where: {
        key: content.key,
      },
      update: {
        text: content.text,
        updatedAt: new Date(content.updatedAt),
      },
      create: {
        key: content.key,
        text: content.text,
        updatedAt: new Date(content.updatedAt),
      },
    })

    return toContentRecord(savedContent)
  }
}
