import cors from 'cors'
import express from 'express'

import { readConfig } from './config'
import { stemsRouter } from './routes/stems'
import { startStemsArchiveWorker } from './workers/createStemsArchive/createStemsArchive'
import { startCleanupOrphanedFilesWorker } from './workers/cleanupOrphanedFiles'
import { scheduleCleanupOrphanedFilesJob } from './jobs/cleanupOrphanedFiles'
import { getStemsArchiveQueue } from './jobs/createStemsArchive'
import { getCleanupOrphanedFilesQueue } from './jobs/cleanupOrphanedFiles'
import { logger, httpLogger } from './logger'
import { createDefaultWorkerServices } from './workers/services'
import { ensureTempDirectory } from './workers/ensureTempDirectory'
// Basic health check endpoint
const health = (_req: express.Request, res: express.Response) => {
  res.json({ status: 'healthy' })
}

const main = async () => {
  const config = readConfig()

  // Clear queues before starting
  try {
    await getStemsArchiveQueue().obliterate({ force: true })
    await getCleanupOrphanedFilesQueue().obliterate({ force: true })
  } catch (error) {
    logger.error({ error }, 'Error clearing queues')
  }

  // Start the workers
  const services = createDefaultWorkerServices()

  // Ensure the temp directory exists
  await ensureTempDirectory(services)

  const {
    worker: stemsWorker,
    removeStemsArchiveJob,
    cancelStemsArchiveJob
  } = startStemsArchiveWorker(services)
  const cleanupWorker = startCleanupOrphanedFilesWorker(services)

  // Schedule the cleanup job
  await scheduleCleanupOrphanedFilesJob()

  // Initialize express app
  const app = express()
  app.use(cors())

  // Add routes
  app.get('/archive/health_check', health)
  app.use(httpLogger)
  app.use(
    '/archive/stems',
    stemsRouter({ removeStemsArchiveJob, cancelStemsArchiveJob })
  )

  // Start the server
  app.listen(config.serverPort, config.serverHost, () => {
    logger.info(
      `Server initialized on ${config.serverHost}:${config.serverPort}`
    )
  })

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...')
    await Promise.all([stemsWorker.close(), cleanupWorker.close()])
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled promise rejection: ${reason}, promise: ${promise}`)
})

main().catch((error) => {
  logger.error({ error }, 'Error starting archiver')
  process.exit(1)
})
