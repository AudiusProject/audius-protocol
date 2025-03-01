import { Queue } from 'bullmq'
import { readConfig } from '../config'
import { STEMS_ARCHIVE_QUEUE_NAME } from '../constants'
import { removeTempFiles } from '../workers/createStemsArchive'
import { logger } from '../logger'

export interface StemsArchiveJobData {
  jobId: string
  trackId: number
  userId: number
  messageHeader: string
  signatureHeader: string
}

export interface StemsArchiveJobResult {
  outputFile: string
}

export interface JobStatus {
  id: string
  state:
    | 'completed'
    | 'failed'
    | 'active'
    | 'waiting'
    | 'delayed'
    | 'prioritized'
  progress?: number
  failedReason?: string
  returnvalue?: StemsArchiveJobResult
}

export const generateJobId = ({
  userId,
  trackId
}: {
  userId: number
  trackId: number
}): string => {
  const input = `${userId}-${trackId}`
  return Buffer.from(input).toString('base64url')
}

let queue: Queue<StemsArchiveJobData, StemsArchiveJobResult> | null = null

export const getStemsArchiveQueue = () => {
  if (!queue) {
    const config = readConfig()
    queue = new Queue<StemsArchiveJobData, StemsArchiveJobResult>(
      STEMS_ARCHIVE_QUEUE_NAME,
      {
        connection: {
          url: config.redisUrl
        },
        defaultJobOptions: {
          // Automatically remove jobs that haven't been downloaded after the orphan period
          removeOnComplete: {
            age: config.orphanedJobsLifetimeSeconds
          },
          // Don't remove failed jobs, they will be cleaned up by the worker
          removeOnFail: false
        }
      }
    )
  }
  return queue
}

export const getOrCreateStemsArchiveJob = async (
  data: Omit<StemsArchiveJobData, 'jobId'>
): Promise<string> => {
  const config = readConfig()
  const queue = getStemsArchiveQueue()
  const jobId = generateJobId(data)

  // Check if job already exists
  const existingJob = await queue.getJob(jobId)
  if (existingJob) {
    // Check if the existing job failed
    const state = await existingJob.getState()
    if (state !== 'failed') {
      return jobId
    }
    // If job failed, remove it so we can create a new one
    await existingJob.remove()
  }

  // Create new job
  await queue.add(
    STEMS_ARCHIVE_QUEUE_NAME,
    { ...data, jobId },
    {
      jobId,
      attempts: config.maxStemsArchiveAttempts,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    }
  )

  return jobId
}

export const getStemsArchiveJob = async (
  jobId: string
): Promise<JobStatus | null> => {
  const queue = getStemsArchiveQueue()
  const job = await queue.getJob(jobId)

  if (!job) {
    return null
  }

  const state = await job.getState()
  const failedReason = job.failedReason
  const returnvalue = job.returnvalue
  const progress = typeof job.progress === 'number' ? job.progress : undefined

  return {
    id: jobId,
    state: state as JobStatus['state'],
    progress,
    ...(failedReason && { failedReason }),
    ...(returnvalue && { returnvalue })
  }
}

export const cleanupStemsArchive = async (jobId: string) => {
  try {
    await removeTempFiles(jobId)
    logger.info({ jobId }, 'Successfully cleaned up stems archive')
  } catch (error) {
    logger.error({ error, jobId }, 'Failed to clean up stems archive')
    throw error
  }
}
