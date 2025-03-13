import { Worker, Job, UnrecoverableError } from 'bullmq'
import { readConfig } from '../config'
import { logger } from '../logger'
import {
  StemsArchiveJobData,
  StemsArchiveJobResult,
  getStemsArchiveQueue
} from '../jobs/createStemsArchive'
import { getAudiusSdk } from '../sdk'
import { Id } from '@audius/sdk'
import fs from 'fs/promises'
import fsSync from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'
import { STEMS_ARCHIVE_QUEUE_NAME } from '../constants'
import archiver from 'archiver'
import { SpaceManager } from './spaceManager'

async function fileExists(path: string) {
  return await fs.access(path).then(
    () => true,
    () => false
  )
}

export async function removeTempFiles(jobId: string) {
  const config = readConfig()
  const jobTempDir = path.join(config.archiverTmpDir, jobId)
  if (await fileExists(jobTempDir)) {
    await fs.rm(jobTempDir, { recursive: true, force: true })
  }
}

async function downloadStemFile({
  url,
  filename,
  jobId,
  signal
}: {
  url: string
  filename: string
  jobId: string
  signal?: AbortSignal
}): Promise<string> {
  const config = readConfig()
  logger.info({ jobId, url, filename }, 'Downloading stem file')
  // Create job-specific temp directory
  const jobTempDir = path.join(config.archiverTmpDir, jobId)
  if (!(await fileExists(jobTempDir))) {
    await fs.mkdir(jobTempDir, { recursive: true })
  }

  const filePath = path.join(jobTempDir, filename)
  const { ok, body, statusText } = await fetch(url, {
    signal
  })

  if (!ok) {
    throw new Error(`Failed to download stem: ${statusText}`)
  }

  if (!body) {
    throw new Error('Response body is null')
  }

  const fileStream = fsSync.createWriteStream(filePath)
  await new Promise((resolve, reject) => {
    body.pipe(fileStream)
    body.on('error', reject)
    fileStream.on('finish', resolve)
  })

  return filePath
}

async function createArchive({
  files,
  jobId,
  archiveName,
  signal
}: {
  files: string[]
  jobId: string
  archiveName: string
  signal?: AbortSignal
}): Promise<string> {
  const config = readConfig()
  const jobTempDir = path.join(config.archiverTmpDir, jobId)
  const outputPath = path.join(jobTempDir, archiveName)

  logger.info({ jobId, outputPath }, 'Creating archive')

  const output = fsSync.createWriteStream(outputPath)
  const archive = archiver('zip', {
    zlib: { level: 6 }
  })

  try {
    // Set up cancellation handler
    if (signal) {
      signal.addEventListener('abort', () => {
        archive.abort()
      })
    }

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

    // Wait for the output stream to finish
    // Archiver docs recommend attaching these listeners before calling finalize
    const finishPromise = new Promise((resolve, reject) => {
      output.on('close', resolve)
      output.on('error', reject)
    })

    // Finalize the archive
    await archive.finalize()
    await finishPromise

    return outputPath
  } finally {
    output.destroy()
    archive.destroy()
  }
}

// TODO: Implement the testability suggestions on the right

export const startStemsArchiveWorker = ({
  spaceManager
}: {
  spaceManager: SpaceManager
}) => {
  const config = readConfig()
  const abortControllers = new Map<string, AbortController>()

  const worker = new Worker<StemsArchiveJobData, StemsArchiveJobResult>(
    STEMS_ARCHIVE_QUEUE_NAME,
    async (job: Job<StemsArchiveJobData>): Promise<StemsArchiveJobResult> => {
      const {
        jobId,
        trackId,
        userId,
        messageHeader,
        signatureHeader,
        includeParentTrack
      } = job.data

      const abortController = new AbortController()
      abortControllers.set(jobId, abortController)

      try {
        const sdk = getAudiusSdk()
        const parsedTrackId = Id.parse(trackId)
        logger.info(
          { jobId, trackId, userId },
          'Starting stems archive creation job'
        )

        const { data: track } = await sdk.tracks.getTrack(
          {
            trackId: parsedTrackId
          },
          {
            signal: abortController.signal
          }
        )

        if (!track) {
          throw new Error('Track details not found')
        }

        logger.debug({ jobId, trackId, userId }, 'Getting track stems')
        const { data: stems = [] } = await sdk.tracks.getTrackStems(
          {
            trackId: parsedTrackId
          },
          {
            signal: abortController.signal
          }
        )

        if (stems.length === 0) {
          throw new Error('No stems found for track')
        }

        const filesToDownload = includeParentTrack
          ? [
              ...stems,
              { ...track, origFilename: track.origFilename ?? track.title }
            ]
          : stems

        logger.debug(
          { jobId, trackId, userId, filesToDownload },
          'Getting file sizes'
        )

        // Check file sizes before downloading
        const fileSizes = await Promise.all(
          filesToDownload.map(async (file) => {
            const inspection = await sdk.tracks.inspectTrack(
              {
                trackId: file.id,
                original: true
              },
              {
                signal: abortController.signal
              }
            )
            if (!inspection.data?.size) {
              throw new Error(`File size not found for ${file.id}`)
            }
            return inspection.data.size
          })
        )

        const totalSizeBytes = fileSizes.reduce((sum, size) => sum + size, 0)
        logger.debug(
          { jobId, trackId, userId, totalSizeBytes },
          'Calculated required disk space'
        )

        logger.debug({ jobId, trackId, userId, stems }, 'Downloading stems')

        await spaceManager.waitForSpace({
          token: jobId,
          bytes: totalSizeBytes,
          timeoutSeconds: config.maxDiskSpaceWaitSeconds,
          signal: abortController.signal
        })

        // Download each stem
        const downloadedFiles = await Promise.all(
          filesToDownload.map(async (stem) => {
            const downloadUrl = await sdk.tracks.getTrackDownloadUrl({
              trackId: stem.id,
              userId: userId ? Id.parse(userId) : undefined,
              userSignature: signatureHeader,
              userData: messageHeader,
              filename: stem.origFilename,
              original: true
            })

            const filename = stem.origFilename
            return downloadStemFile({
              url: downloadUrl,
              filename,
              jobId,
              signal: abortController.signal
            })
          })
        )

        logger.info(
          { jobId, trackId, userId, files: downloadedFiles },
          'Successfully downloaded all stems'
        )

        // Create archive from downloaded files
        const outputFile = await createArchive({
          files: downloadedFiles,
          jobId,
          archiveName: `${track.title}.zip`,
          signal: abortController.signal
        })

        // Clean up temp files except the output archive
        for (const file of downloadedFiles) {
          if (file !== outputFile && (await fileExists(file))) {
            await fs.unlink(file)
          }
        }

        logger.info(
          { jobId, trackId, userId, outputFile },
          'Successfully created stems archive'
        )

        return { outputFile }
      } catch (error) {
        if (abortController.signal.aborted) {
          logger.debug({ jobId }, 'Job aborted')
          throw new UnrecoverableError('Job aborted')
        }

        logger.error(
          { error: `${error}`, jobId, trackId, userId },
          'Failed to create stems archive'
        )
        throw error
      } finally {
        abortControllers.delete(jobId)
      }
    },
    {
      connection: {
        url: config.redisUrl
      },
      concurrency: config.concurrentJobs
    }
  )

  const cancelStemsArchiveJob = async (jobId: string) => {
    if (abortControllers.has(jobId)) {
      const abortController = abortControllers.get(jobId)
      abortController?.abort()
    }
  }

  const removeStemsArchiveJob = async (jobId: string) => {
    const queue = getStemsArchiveQueue()
    try {
      await removeTempFiles(jobId)
      await spaceManager.releaseSpace(jobId)
    } catch (error) {
      logger.error(
        { error: `${error}`, jobId },
        'Failed to clean up stems archive'
      )
      throw error
    } finally {
      await queue.remove(jobId)
    }
  }

  // Abort all active jobs when the worker is closing
  worker.on('closing', () => {
    for (const abortController of abortControllers.values()) {
      abortController.abort()
    }
  })

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Stems archive job completed successfully')
  })

  worker.on('failed', async (job, error) => {
    logger.error({ jobId: job?.id, error }, 'Stems archive job failed')
    if (job?.data.jobId) {
      await removeStemsArchiveJob(job.data.jobId)
    }
  })

  return { worker, removeStemsArchiveJob, cancelStemsArchiveJob }
}
