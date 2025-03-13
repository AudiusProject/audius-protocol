import { Job, Worker } from 'bullmq'
import { readConfig } from '../config'
import { logger } from '../logger'
import { CleanupOrphanedFilesJobData } from '../jobs/cleanupOrphanedFiles'
import path from 'path'
import fs from 'fs/promises'
import { getStemsArchiveQueue } from '../jobs/createStemsArchive'
import { CLEANUP_ORPHANED_FILES_QUEUE_NAME } from '../constants'
import { SpaceManager } from './spaceManager'

const cleanupOrphanedFiles = async ({
  spaceManager
}: {
  spaceManager: SpaceManager
}) => {
  const config = readConfig()
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
          { error: `${error}`, file: filePath },
          'Error processing file during cleanup'
        )
      }
    }
  } catch (error) {
    logger.error({ error: `${error}` }, 'Error during orphaned files cleanup')
    throw error
  }
}

export const createCleanupOrphanedFilesWorker = ({
  spaceManager
}: {
  spaceManager: SpaceManager
}) => {
  const config = readConfig()

  const worker = new Worker<CleanupOrphanedFilesJobData>(
    CLEANUP_ORPHANED_FILES_QUEUE_NAME,
    async (job: Job<CleanupOrphanedFilesJobData>) => {
      logger.debug({ jobId: job.id }, 'Starting orphaned files cleanup')
      await cleanupOrphanedFiles({ spaceManager })
      logger.debug({ jobId: job.id }, 'Completed orphaned files cleanup')
    },
    {
      connection: {
        url: config.redisUrl
      }
    }
  )

  worker.on('error', (error) => {
    logger.error({ error: `${error}` }, 'Cleanup orphaned files worker error')
  })

  return worker
}
