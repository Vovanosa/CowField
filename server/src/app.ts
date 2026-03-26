import cors from 'cors'
import express from 'express'
import { ZodError } from 'zod'

import { HttpError } from './errors/HttpError'
import { AuthController } from './controllers/authController'
import { createAuthRoutes } from './routes/authRoutes'
import { createLevelRoutes } from './routes/levelRoutes'
import { createPlayerProgressRoutes } from './routes/playerProgressRoutes'
import { createPlayerStatisticsRoutes } from './routes/playerStatisticsRoutes'
import { LevelController } from './controllers/levelController'
import { PlayerProgressController } from './controllers/playerProgressController'
import { PlayerStatisticsController } from './controllers/playerStatisticsController'
import { AuthService } from './services/AuthService'
import { LevelService } from './services/LevelService'
import { PlayerProgressService } from './services/PlayerProgressService'
import { PlayerStatisticsService } from './services/PlayerStatisticsService'
import { createRepositories } from './repositories/createRepositories'
import { getPrismaClient } from './db/prismaClient'

function getAllowedOrigins() {
  const configuredOrigins = process.env.ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (configuredOrigins && configuredOrigins.length > 0) {
    return configuredOrigins
  }

  return ['http://localhost:5173']
}

export function createApp() {
  const app = express()
  const allowedOrigins = new Set(getAllowedOrigins())
  const repositories = createRepositories()
  const levelService = new LevelService(repositories.levelRepository)
  const playerProgressService = new PlayerProgressService(repositories.playerProgressRepository)
  const authService = new AuthService(
    repositories.userRepository,
    repositories.sessionRepository,
    repositories.passwordResetTokenRepository,
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
    repositories.playerProgressRepository,
    repositories.playerStatisticsRepository,
  )
  const authController = new AuthController(authService)
  const levelController = new LevelController(levelService)
  const playerProgressController = new PlayerProgressController(playerProgressService)
  const playerStatisticsController = new PlayerStatisticsController(playerStatisticsService)

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true)
          return
        }

        callback(new HttpError(403, 'Origin is not allowed by CORS.'))
      },
      allowedHeaders: ['Authorization', 'Content-Type'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', async (_request, response) => {
    await getPrismaClient().$queryRaw`SELECT 1`
    response.json({
      ok: true,
      storage: 'database',
    })
  })

  app.use('/api/auth', createAuthRoutes(authController))
  app.use('/api/levels', createLevelRoutes(levelController, authService))
  app.use('/api/progress', createPlayerProgressRoutes(playerProgressController, authService))
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
