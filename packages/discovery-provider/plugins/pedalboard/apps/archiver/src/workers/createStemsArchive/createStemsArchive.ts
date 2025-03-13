import { Worker, Job, UnrecoverableError, WorkerListener } from 'bullmq'
import {
  StemsArchiveJobData,
  StemsArchiveJobResult,
  getStemsArchiveQueue
} from '../../jobs/createStemsArchive'
import { OptionalId } from '@audius/sdk'
import { STEMS_ARCHIVE_QUEUE_NAME } from '../../constants'
import path from 'path'
import { StemsArchiveWorkerServices } from './services'
import { createUtils } from './utils'

type StemsArchiveWorkerListener = WorkerListener<
  StemsArchiveJobData,
  StemsArchiveJobResult
>

export const createStemsArchiveWorker = (
  services: StemsArchiveWorkerServices
) => {
  const { config, spaceManager, fs, logger, sdk } = services
  const { createArchive, downloadFile, fileExists, removeTempFiles } =
    createUtils(services)

  const abortControllers = new Map<string, AbortController>()

  const processJob = async (
    job: Job<StemsArchiveJobData>
  ): Promise<StemsArchiveJobResult> => {
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
      logger.info(
        { jobId, trackId, userId },
        'Starting stems archive creation job'
      )

      const hashedTrackId = OptionalId.parse(trackId)
      const hashedUserId = OptionalId.parse(userId)

      if (!hashedTrackId) {
        throw new UnrecoverableError(`Failed to encode track Id: ${trackId}`)
      }
      if (!hashedUserId) {
        throw new UnrecoverableError(`No userID provided`)
      }
      if (!signatureHeader) {
        throw new UnrecoverableError(`Missing signature header`)
      }
      if (!messageHeader) {
        throw new UnrecoverableError(`Missing message header`)
      }

      const { data: track } = await sdk.tracks.getTrack(
        {
          trackId: hashedTrackId
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
          trackId: hashedTrackId
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

      // Create job-specific temp directory
      const jobTempDir = path.join(config.archiverTmpDir, jobId)
      if (!(await fileExists(jobTempDir))) {
        await fs.mkdir(jobTempDir, { recursive: true })
      }

      // Download each stem
      const downloadedFiles = await Promise.all(
        filesToDownload.map(async (stem) => {
          const downloadUrl = await sdk.tracks.getTrackDownloadUrl({
            trackId: stem.id,
            userId: hashedUserId,
            userSignature: signatureHeader,
            userData: messageHeader,
            filename: stem.origFilename,
            original: true
          })

          const filePath = path.join(jobTempDir, stem.origFilename)
          return downloadFile({
            url: downloadUrl,
            filePath,
            jobId,
            signal: abortController.signal
          })
        })
      )

      logger.info(
        { jobId, trackId, userId, files: downloadedFiles },
        'Successfully downloaded all stems'
      )

      logger.debug(
        { jobId, trackId, userId, downloadedFiles },
        'Creating archive'
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

      throw error
    } finally {
      abortControllers.delete(jobId)
    }
  }

  const removeStemsArchiveJob = async (jobId: string) => {
    logger.info({ jobId }, 'Removing stems archive job')
    const queue = getStemsArchiveQueue()
    try {
      await removeTempFiles(jobId)
      await spaceManager.releaseSpace(jobId)
      logger.info({ jobId }, 'Removed stems archive job')
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

  const cancelStemsArchiveJob = async (jobId: string) => {
    logger.info({ jobId }, 'Cancelling stems archive job')
    const job = await getStemsArchiveQueue().getJob(jobId)
    if (job && (await job.isCompleted())) {
      try {
        await removeStemsArchiveJob(jobId)
      } finally {
        await job.remove()
      }
    } else if (abortControllers.has(jobId)) {
      const abortController = abortControllers.get(jobId)
      abortController?.abort()
    } else {
      logger.info({ jobId }, 'Stems archive job not found')
    }
  }

  // Abort all active jobs when the worker is closing
  const onClosing: StemsArchiveWorkerListener['closing'] = () => {
    for (const abortController of abortControllers.values()) {
      abortController.abort()
    }
  }

  const onCompleted: StemsArchiveWorkerListener['completed'] = (job) => {
    logger.info({ jobId: job.id }, 'Stems archive job completed successfully')
  }

  const onFailed: StemsArchiveWorkerListener['failed'] = async (job, error) => {
    logger.error({ jobId: job?.id, error }, 'Stems archive job failed')
    if (job?.data.jobId) {
      await removeStemsArchiveJob(job.data.jobId)
    }
  }

  return {
    processJob,
    onClosing,
    onCompleted,
    onFailed,
    removeStemsArchiveJob,
    cancelStemsArchiveJob
  }
}

export const startStemsArchiveWorker = (
  services: StemsArchiveWorkerServices
) => {
  const {
    processJob,
    onClosing,
    onCompleted,
    onFailed,
    removeStemsArchiveJob,
    cancelStemsArchiveJob
  } = createStemsArchiveWorker(services)

  const worker = new Worker<StemsArchiveJobData, StemsArchiveJobResult>(
    STEMS_ARCHIVE_QUEUE_NAME,
    processJob,
    {
      connection: {
        url: services.config.redisUrl
      },
      concurrency: services.config.concurrentJobs
    }
  )

  worker.on('closing', onClosing)
  worker.on('completed', onCompleted)
  worker.on('failed', onFailed)

  return { worker, removeStemsArchiveJob, cancelStemsArchiveJob }
}
