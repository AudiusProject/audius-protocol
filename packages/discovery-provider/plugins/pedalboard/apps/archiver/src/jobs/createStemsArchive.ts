import { Queue } from 'bullmq'
import { readConfig } from '../config'
import { URL } from 'url'

export interface StemsArchiveJobData {
  trackId: number
  userId: number
  messageHeader: string
  signatureHeader: string
}

export interface StemsArchiveJobResult {}

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

const QUEUE_NAME = 'stems-archive'

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
    queue = new Queue<StemsArchiveJobData, StemsArchiveJobResult>(QUEUE_NAME, {
      connection: {
        host: new URL(config.redisUrl).hostname,
        port: parseInt(new URL(config.redisUrl).port)
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false
      }
    })
  }
  return queue
}

export const getOrCreateStemsArchiveJob = async (
  data: StemsArchiveJobData
): Promise<string> => {
  const queue = getStemsArchiveQueue()

  const jobId = generateJobId(data)

  // Check if job already exists
  const existingJob = await queue.getJob(jobId)
  if (existingJob) {
    return jobId
  }

  // Create new job if it doesn't exist
  await queue.add(QUEUE_NAME, data, {
    jobId,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  })

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
