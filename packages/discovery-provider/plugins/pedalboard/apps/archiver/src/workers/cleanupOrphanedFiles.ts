import { Job, Worker } from 'bullmq'
import { CleanupOrphanedFilesJobData } from '../jobs/cleanupOrphanedFiles'
import { getStemsArchiveQueue } from '../jobs/createStemsArchive'
import { CLEANUP_ORPHANED_FILES_QUEUE_NAME } from '../constants'
import { WorkerServices } from './services'

const createCleanupOrphanedFilesWorker = (services: WorkerServices) => {
  const { fs, path, config, spaceManager } = services

  const processJob = async (job: Job<CleanupOrphanedFilesJobData>) => {
    const logger = services.logger.child({
      worker: 'cleanupOrphanedFiles',
      jobId: job.id
    })
    logger.debug('Starting orphaned files cleanup')
    const tempDir = path.join(config.archiverTmpDir)

    try {
      // Get all files in the temp directory
      const files = await fs.readdir(tempDir)

      const jobs = await getStemsArchiveQueue().getJobs()
      const jobIds = new Set(
        jobs.map((job) => job.id).filter((id): id is string => id !== undefined)
      )

      // Check each file
      for (const file of files) {
        const filePath = path.join(tempDir, file)
        try {
          if (!jobIds.has(file)) {
            await fs.rm(filePath, { recursive: true, force: true })
            logger.info({ file }, 'Deleted orphaned job directory')
            await spaceManager.releaseSpace(file)
          }
        } catch (error) {
          logger.error(
            { error, file: filePath },
            'Error processing file during cleanup'
          )
        }
      }
      logger.debug('Completed orphaned files cleanup')
    } catch (error) {
      logger.error({ error }, 'Error during orphaned files cleanup')
      throw error
    }
  }

  return {
    processJob
  }
}

export const startCleanupOrphanedFilesWorker = (services: WorkerServices) => {
  const { config } = services

  const { processJob } = createCleanupOrphanedFilesWorker(services)

  const worker = new Worker<CleanupOrphanedFilesJobData>(
    CLEANUP_ORPHANED_FILES_QUEUE_NAME,
    processJob,
    {
      connection: {
        url: config.redisUrl
      }
    }
  )

  return worker
}
