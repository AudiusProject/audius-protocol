/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Sql } from 'postgres'
import type { AudiusSdk } from '@audius/sdk/dist/sdk/index.d.ts'
import type { ScheduledReleaseService } from './services/scheduledReleaseService'
import type { XmlProcessorService } from './services/xmlProcessorService'
import express, { Express, Request, Response } from 'express'
import path from 'path'
import * as uploadController from './controllers/uploadsController'
// import cors from 'cors'

export default function createApp(
  sql: Sql,
  _audiusSdk: AudiusSdk,
  xmlProcessorService: XmlProcessorService,
  _scheduledReleaseService: ScheduledReleaseService
) {
  /*
   * Setup app
   */
  const app: Express = express()

  /*
   * Define API routes
   */

  app.get('/api/env', (_req: Request, res: Response) => {
    const envData = {
      data: {
        env: process.env.NODE_ENV,
        ddexKey: process.env.DDEX_KEY,
        optimizelySdkKey: process.env.OPTIMIZELY_SDK_KEY
      }
    }
    res.json(envData)
  })
  app.get('/api/releases', uploadController.getReleases(sql))
  app.get('/api/uploads', uploadController.getUploads(sql))
  app.post('/api/upload', uploadController.postUploadXml(xmlProcessorService))
  app.get('/api/health_check', (_req: Request, res: Response) => {
    res.status(200).send('DDEX is alive!')
  })

  /*
   * Serve the React app as static assets at the root path
   */

  const isDev = process.env.IS_DEV === 'true'
  const buildPath = isDev
    ? path.join(__dirname, '..', '..', 'client', 'dist')
    : path.join(__dirname, '..', 'public')
  app.use(express.static(buildPath))
  app.use(express.static(buildPath))
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(buildPath, 'index.html'))
  })

  // Fallback to handle client-side routing, excluding /api routes
  app.get('*', (req: Request, res: Response, next) => {
    if (
      req.url.startsWith('/api') ||
      req.url.startsWith('/trpc') ||
      req.url.startsWith('/panel')
    ) {
      return next()
    }
    res.sendFile(path.join(buildPath, 'index.html'))
  })

  return app
}
