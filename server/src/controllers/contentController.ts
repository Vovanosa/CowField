import type { Request, Response } from 'express'

import { contentParamsSchema, contentRecordInputSchema } from '../schemas/contentSchemas'
import { ContentService } from '../services/ContentService'

export class ContentController {
  private readonly contentService: ContentService

  constructor(contentService: ContentService) {
    this.contentService = contentService
  }

  getByKey = async (request: Request, response: Response) => {
    const params = contentParamsSchema.parse(request.params)
    const content = await this.contentService.getByKey(params.key)

    response.json(content)
  }

  save = async (request: Request, response: Response) => {
    const params = contentParamsSchema.parse(request.params)
    const body = contentRecordInputSchema.parse({
      ...request.body,
      key: params.key,
    })
    const content = await this.contentService.save(body)

    response.status(201).json(content)
  }
}
