import { Worker, Job } from 'bullmq'
import { readConfig } from '../config'
import { logger } from '../logger'
import {
  StemsArchiveJobData,
  StemsArchiveJobResult,
  getStemsArchiveQueue
} from '../jobs/createStemsArchive'
import { getAudiusSdk } from '../sdk'
import { Id } from '@audius/sdk'
import * as fs from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'
import { STEMS_ARCHIVE_QUEUE_NAME } from '../constants'
import archiver from 'archiver'

export async function removeTempFiles(jobId: string) {
  const config = readConfig()
  const jobTempDir = path.join(config.archiverTmpDir, jobId)
  if (fs.existsSync(jobTempDir)) {
    fs.rmSync(jobTempDir, { recursive: true })
  }
}

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

async function createArchive({
  files,
  jobId,
  archiveName
}: {
  files: string[]
  jobId: string
  archiveName: string
}): Promise<string> {
  const config = readConfig()
  const jobTempDir = path.join(config.archiverTmpDir, jobId)
  const outputPath = path.join(jobTempDir, archiveName)

  logger.info({ jobId, outputPath }, 'Creating archive')

  const output = fs.createWriteStream(outputPath)
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  })

  // Listen for archive errors
  archive.on('error', (error: Error) => {
    throw error
  })

  // Pipe archive data to the output file
  archive.pipe(output)

  // Add each file to the archive with a flattened filename
  for (const file of files) {
    const filename = path.basename(file)
    archive.file(file, { name: filename })
  }

  // Finalize the archive
  await archive.finalize()

  // Wait for the output stream to finish
  await new Promise((resolve, reject) => {
    output.on('close', resolve)
    output.on('error', reject)
  })

  return outputPath
}

export const startStemsArchiveWorker = () => {
  const config = readConfig()
  const worker = new Worker<StemsArchiveJobData, StemsArchiveJobResult>(
    STEMS_ARCHIVE_QUEUE_NAME,
    async (job: Job<StemsArchiveJobData>): Promise<StemsArchiveJobResult> => {
      const { jobId, trackId, userId, messageHeader, signatureHeader } =
        job.data

      try {
        const sdk = getAudiusSdk()
        const parsedTrackId = Id.parse(trackId)
        logger.info({ trackId, userId }, 'Starting stems archive creation job')

        const { data: track } = await sdk.tracks.getTrack({
          trackId: parsedTrackId
        })

        if (!track) {
          throw new Error('Track details not found')
        }

        logger.info({ trackId, userId }, 'Getting track stems')
        const { data: stems = [] } = await sdk.tracks.getTrackStems({
          trackId: parsedTrackId
        })

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
              filename: stem.origFilename,
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

        // Create archive from downloaded files
        const outputFile = await createArchive({
          files: downloadedFiles,
          jobId,
          archiveName: `${track.title} - stems.zip`
        })

        // Clean up temp files except the output archive
        for (const file of downloadedFiles) {
          if (file !== outputFile && fs.existsSync(file)) {
            fs.unlinkSync(file)
          }
        }

        logger.info(
          { trackId, userId, outputFile },
          'Successfully created stems archive'
        )

        return { outputFile }
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
    if (job?.data.jobId) {
      removeTempFiles(job.data.jobId)
    }
  })

  return worker
}

export const cleanupStemsArchiveJob = async (jobId: string) => {
  const queue = getStemsArchiveQueue()
  try {
    await removeTempFiles(jobId)
  } catch (error) {
    // TODO: Proper logging
    logger.error(
      { error: `${error}`, jobId },
      'Failed to clean up stems archive'
    )
    throw error
  } finally {
    queue.remove(jobId)
  }
}
