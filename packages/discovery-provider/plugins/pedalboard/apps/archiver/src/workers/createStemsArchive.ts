import { Worker, Job } from 'bullmq'
import { readConfig } from '../config'
import { logger } from '../logger'
import {
  StemsArchiveJobData,
  StemsArchiveJobResult
} from '../jobs/createStemsArchive'
import { getAudiusSdk } from '../sdk'
import { Id } from '@audius/sdk'
import * as fs from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'
import { STEMS_ARCHIVE_QUEUE_NAME } from '../constants'

async function downloadStemFile(
  url: string,
  filename: string,
  jobId: string
): Promise<string> {
  const config = readConfig()
  logger.info({ url, filename, jobId }, 'Downloading stem file')
  // Create job-specific temp directory
  const jobTempDir = path.join(config.archiverTmpDir, jobId)
  if (!fs.existsSync(jobTempDir)) {
    fs.mkdirSync(jobTempDir, { recursive: true })
  }

  const filePath = path.join(jobTempDir, filename)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to download stem: ${response.statusText}`)
  }

  const fileStream = fs.createWriteStream(filePath)
  await new Promise((resolve, reject) => {
    response.body.pipe(fileStream)
    response.body.on('error', reject)
    fileStream.on('finish', resolve)
  })

  return filePath
}

export const startStemsArchiveWorker = () => {
  const config = readConfig()
  const worker = new Worker<StemsArchiveJobData>(
    STEMS_ARCHIVE_QUEUE_NAME,
    async (job: Job<StemsArchiveJobData>): Promise<StemsArchiveJobResult> => {
      const { jobId, trackId, userId, messageHeader, signatureHeader } =
        job.data

      try {
        const sdk = getAudiusSdk()
        logger.info({ trackId, userId }, 'Starting stems archive creation job')

        logger.info({ trackId, userId }, 'Getting track stems')
        const res = await sdk.tracks.getTrackStems({
          trackId: Id.parse(trackId)
        })

        const stems = res.data || []
        if (stems.length === 0) {
          throw new Error('No stems found for track')
        }

        logger.info({ trackId, userId, stems }, 'Downloading stems')
        // Download each stem
        const downloadedFiles = await Promise.all(
          stems.map(async (stem) => {
            const downloadUrl = await sdk.tracks.getTrackDownloadUrl({
              trackId: stem.id,
              userId: userId ? Id.parse(userId) : undefined,
              userSignature: signatureHeader,
              userData: messageHeader,
              original: true
            })

            const filename = `${stem.id}_${stem.category}_${stem.origFilename}`
            return downloadStemFile(downloadUrl, filename, jobId)
          })
        )

        logger.info(
          { trackId, userId, files: downloadedFiles },
          'Successfully downloaded all stems'
        )

        // TODO: Create archive from downloaded files
        // TODO: Clean up temp files after archiving

        logger.info({ trackId, userId }, 'Successfully created stems archive')

        return { outputFile: 'test.zip' }
      } catch (error) {
        logger.error(
          { error: `${error}`, trackId, userId },
          'Failed to create stems archive'
        )
        throw error
      }
    },
    {
      connection: {
        url: config.redisUrl
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
