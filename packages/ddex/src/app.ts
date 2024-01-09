/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Sql } from 'postgres'
import type { AudiusSdk } from '@audius/sdk/dist/sdk/index.d.ts'
import type { ScheduledReleaseService } from './services/scheduledReleaseService'
import type { XmlProcessorService } from './services/xmlProcessorService'
import express, { Express, Request, Response } from 'express'
import path from 'path'
import * as uploadController from './controllers/uploadController'
// import cors from 'cors'

export default function createApp(
  sql: Sql,
  audiusSdk: AudiusSdk,
  xmlProcessorService: XmlProcessorService,
  scheduledReleaseService: ScheduledReleaseService
) {
  /*
   * Setup app
   */
  const app: Express = express()

  // Uncomment when developing locally as this is required for uploads to work
  // when running the frontend and backend apps separately.
  // TODO make the dev flow more seamless
  // const corsOptions = {
  //   origin: 'http://localhost:5173'
  // }
  // app.use(cors(corsOptions));

  /*
   * Define API routes
   */

  app.post('/api/upload', uploadController.postUploadXml(xmlProcessorService))
  app.get('/api/health_check', (req: Request, res: Response) => {
    res.status(200).send('DDEX is alive!')
  })

  /*
   * Serve the React app as static assets at the root path
   */

  const isDev = process.env.IS_DEV === 'true'
  const buildPath = isDev
    ? path.join(__dirname, '..', '..', 'ddex-frontend', 'dist')
    : path.join(__dirname, '..', 'public')
  app.use(express.static(buildPath))
  app.use(express.static(buildPath))
  app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(buildPath, 'index.html'))
  })
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(buildPath, 'index.html')) // Fallback for handling client-side routing
  })

  return app
}
