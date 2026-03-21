import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { ZodError } from 'zod'

import { HttpError } from './errors/HttpError'
import { AuthController } from './controllers/authController'
import { FileContentRepository } from './repositories/FileContentRepository'
import { FileLevelRepository } from './repositories/FileLevelRepository'
import { FilePasswordResetTokenRepository } from './repositories/FilePasswordResetTokenRepository'
import { FilePlayerProgressRepository } from './repositories/FilePlayerProgressRepository'
import { FilePlayerSettingsRepository } from './repositories/FilePlayerSettingsRepository'
import { FilePlayerStatisticsRepository } from './repositories/FilePlayerStatisticsRepository'
import { FileSessionRepository } from './repositories/FileSessionRepository'
import { FileUserRepository } from './repositories/FileUserRepository'
import { createAuthRoutes } from './routes/authRoutes'
import { createContentRoutes } from './routes/contentRoutes'
import { createLevelRoutes } from './routes/levelRoutes'
import { createPlayerProgressRoutes } from './routes/playerProgressRoutes'
import { createPlayerSettingsRoutes } from './routes/playerSettingsRoutes'
import { createPlayerStatisticsRoutes } from './routes/playerStatisticsRoutes'
import { ContentController } from './controllers/contentController'
import { LevelController } from './controllers/levelController'
import { PlayerProgressController } from './controllers/playerProgressController'
import { PlayerSettingsController } from './controllers/playerSettingsController'
import { PlayerStatisticsController } from './controllers/playerStatisticsController'
import { AuthService } from './services/AuthService'
import { ContentService } from './services/ContentService'
import { LevelService } from './services/LevelService'
import { PlayerProgressService } from './services/PlayerProgressService'
import { PlayerSettingsService } from './services/PlayerSettingsService'
import { PlayerStatisticsService } from './services/PlayerStatisticsService'

export function createApp() {
  const app = express()
  const repository = new FileLevelRepository(
    path.resolve(process.cwd(), 'levels_data'),
  )
  const contentRepository = new FileContentRepository(
    path.resolve(process.cwd(), 'content_data'),
  )
  const playerProgressRepository = new FilePlayerProgressRepository(
    path.resolve(process.cwd(), 'progress_data'),
  )
  const playerStatisticsRepository = new FilePlayerStatisticsRepository(
    path.resolve(process.cwd(), 'progress_data'),
  )
  const playerSettingsRepository = new FilePlayerSettingsRepository(
    path.resolve(process.cwd(), 'progress_data'),
  )
  const userRepository = new FileUserRepository(
    path.resolve(process.cwd(), 'auth_data'),
  )
  const sessionRepository = new FileSessionRepository(
    path.resolve(process.cwd(), 'auth_data'),
  )
  const passwordResetTokenRepository = new FilePasswordResetTokenRepository(
    path.resolve(process.cwd(), 'auth_data'),
  )
  const levelService = new LevelService(repository)
  const contentService = new ContentService(contentRepository)
  const playerProgressService = new PlayerProgressService(playerProgressRepository)
  const playerSettingsService = new PlayerSettingsService(playerSettingsRepository)
  const authService = new AuthService(
    userRepository,
    sessionRepository,
    passwordResetTokenRepository,
    process.env.BULLPEN_ADMIN_EMAIL ?? 'vovanosa06@gmail.com',
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CALLBACK_URL
      ? {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackUrl: process.env.GOOGLE_CALLBACK_URL,
          frontendCallbackUrl:
            process.env.GOOGLE_FRONTEND_CALLBACK_URL ??
            'http://localhost:5173/auth/google/callback',
          stateSecret:
            process.env.GOOGLE_STATE_SECRET ?? 'bullpen-google-state-secret',
        }
      : null,
  )
  const playerStatisticsService = new PlayerStatisticsService(
    playerProgressRepository,
    playerStatisticsRepository,
  )
  const authController = new AuthController(authService)
  const levelController = new LevelController(levelService)
  const contentController = new ContentController(contentService)
  const playerProgressController = new PlayerProgressController(playerProgressService)
  const playerSettingsController = new PlayerSettingsController(playerSettingsService)
  const playerStatisticsController = new PlayerStatisticsController(playerStatisticsService)

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.use('/api/auth', createAuthRoutes(authController))
  app.use('/api/levels', createLevelRoutes(levelController, authService))
  app.use('/api/content', createContentRoutes(contentController, authService))
  app.use('/api/progress', createPlayerProgressRoutes(playerProgressController, authService))
  app.use('/api/settings', createPlayerSettingsRoutes(playerSettingsController, authService))
  app.use('/api/statistics', createPlayerStatisticsRoutes(playerStatisticsController, authService))

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      void next

      if (error instanceof ZodError) {
        response.status(400).json({
          message: 'Invalid request payload.',
          issues: error.issues.map((issue) => issue.message),
        })
        return
      }

      if (error instanceof HttpError) {
        response.status(error.statusCode).json({
          message: error.message,
        })
        return
      }

      response.status(500).json({
        message: 'Unexpected server error.',
      })
    },
  )

  return app
}
