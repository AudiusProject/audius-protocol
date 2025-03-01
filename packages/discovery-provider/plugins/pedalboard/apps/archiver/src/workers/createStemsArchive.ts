import { Worker, Job } from 'bullmq'
import { readConfig } from '../config'
import { logger } from '../logger'
import { StemsArchiveJobData } from '../jobs/createStemsArchive'
import { URL } from 'url'

const QUEUE_NAME = 'stems-archive'

export const startStemsArchiveWorker = () => {
  const config = readConfig()
  const worker = new Worker<StemsArchiveJobData>(
    QUEUE_NAME,
    async (job: Job<StemsArchiveJobData>) => {
      const { trackId, userId, messageHeader, signatureHeader } = job.data

      try {
        logger.info({ trackId, userId }, 'Starting stems archive creation job')

        // These will be used in the actual implementation
        void messageHeader
        void signatureHeader

        // TODO: Implement the following steps:
        // 1. Validate the message and signature headers
        // 2. Fetch track stems information
        // 3. Download stems
        // 4. Create archive
        // 5. Store archive and return location

        logger.info({ trackId, userId }, 'Successfully created stems archive')

        return { success: true }
      } catch (error) {
        logger.error(
          { error, trackId, userId },
          'Failed to create stems archive'
        )
        throw error
      }
    },
    {
      connection: {
        host: new URL(config.redisUrl).hostname,
        port: parseInt(new URL(config.redisUrl).port)
      },
      concurrency: 5
    }
  )

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Stems archive job completed successfully')
  })

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'Stems archive job failed')
  })

  return worker
}
