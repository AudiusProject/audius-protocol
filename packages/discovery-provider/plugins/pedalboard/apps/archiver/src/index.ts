import cors from 'cors'
import express from 'express'
import { log } from '@pedalboard/logger'

import { readConfig } from './config'
import stemsRouter from './routes/stems'
import { startStemsArchiveWorker } from './workers/createStemsArchive'

// Basic health check endpoint
const health = (_req: express.Request, res: express.Response) => {
  res.json({ status: 'healthy' })
}

const main = async () => {
  const config = readConfig()

  // Start the worker
  const worker = startStemsArchiveWorker()

  // Initialize express app
  const app = express()
  app.use(cors())

  // Add routes
  app.get('/archive/health_check', health)
  app.use('/archive/stems', stemsRouter)

  // Start the server
  app.listen(config.serverPort, config.serverHost, () => {
    log(`Server initialized on ${config.serverHost}:${config.serverPort}`)
  })

  // Graceful shutdown
  const shutdown = async () => {
    log('Shutting down gracefully...')
    await worker.close()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled promise rejection: ${reason}, promise: ${promise}`)
})

main().catch(log)
