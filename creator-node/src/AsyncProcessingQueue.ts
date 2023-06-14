import type { Job } from 'bullmq'
import type { Request } from 'express'
import type { SpanContext } from '@opentelemetry/api'

import { Queue, Worker } from 'bullmq'
import { logger } from './logging'
import { ValuesOf, LogContext } from './utils'

// Processing fns
import {
  handleTrackContentRoute as trackContentUpload,
  handleTranscodeAndSegment as transcodeAndSegment,
  handleTranscodeHandOff as transcodeHandOff
} from './components/tracks/tracksComponentService'
import { instrumentTracing, tracing } from './tracer'

const {
  processTranscodeAndSegments
} = require('./components/tracks/trackContentUploadManager')
const redisClient = require('./redis')
const config = require('./config')

const MAX_CONCURRENCY = 100
const EXPIRATION_SECONDS = 86400 // 24 hours in seconds

const QUEUE_NAME = 'async-processing'

const ASYNC_PROCESSING_QUEUE_HISTORY = 500

export const ProcessNames = {
  trackContentUpload: 'trackContentUpload',
  transcodeAndSegment: 'transcodeAndSegment',
  processTranscodeAndSegments: 'processTranscodeAndSegments',
  transcodeHandOff: 'transcodeHandOff'
} as const

export const ProcessStates = {
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  FAILED: 'FAILED'
} as const

type AddTaskParams = {
  logContext: LogContext
  task: string
  req: Request
  parentSpanContext?: SpanContext
}

/**
 * This queue accepts jobs (any function) that needs to be processed asynchonously.
 * Once the job is complete, the response is added to redis. The response can be
 * accessed through the `/async_processing_status` route by passing in the job uuid
 * as part of the query params.
 */

export class AsyncProcessingQueue {
  queue: Queue<any, any, string>
  libs: any
  constructProcessKey: (uuid: string) => string

  constructor(libs: any, prometheusRegistry: any) {
    const connection = {
      host: config.get('redisHost'),
      port: config.get('redisPort')
    }
    this.queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: ASYNC_PROCESSING_QUEUE_HISTORY,
        removeOnFail: ASYNC_PROCESSING_QUEUE_HISTORY
      }
    })

    this.libs = libs

    const untracedProcessTask = this.processTask
    const worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { logContext, parentSpanContext, task } = job.data
        const processTask = instrumentTracing({
          name: `AsyncProcessingQueue.process ${task}`,
          fn: untracedProcessTask,
          context: this,
          options: {
            // if a parentSpanContext is provided
            // reference it so the async queue job can remember
            // who enqueued it
            links: parentSpanContext
              ? [
                  {
                    context: parentSpanContext
                  }
                ]
              : [],
            attributes: {
              requestID: logContext.requestId,
              [tracing.CODE_FILEPATH]: __filename
            }
          }
        })

        await processTask(job)
      },
      {
        connection,
        concurrency: MAX_CONCURRENCY
      }
    )
    prometheusRegistry.startQueueMetrics(this.queue, worker)

    this.getAsyncProcessingQueueJobs =
      this.getAsyncProcessingQueueJobs.bind(this)
    this.constructProcessKey = this.constructAsyncProcessingKey.bind(this)
  }

  async processTask(job: Job) {
    const { logContext, task } = job.data

    const func = this.getFn(task)

    if (task === ProcessNames.transcodeHandOff) {
      const { transcodeFilePath, segmentFileNames, sp } =
        await this.monitorProgress(task, transcodeHandOff, job.data)

      if (!transcodeFilePath || !segmentFileNames) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        logger.debug(
          'Failed to hand off transcode. Retrying upload to current node...'
        )
        await this.addTrackContentUploadTask({
          logContext,
          req: job.data.req,
          parentSpanContext: tracing.currentSpanContext()
        })
      } else {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        logger.debug(
          `Succesfully handed off transcoding and segmenting to sp=${sp}. Wrapping up remainder of track association..`
        )
        await this.addProcessTranscodeAndSegmentTask({
          parentSpanContext: tracing.currentSpanContext(),
          logContext,
          req: { ...job.data.req, transcodeFilePath, segmentFileNames }
        })
        return { response: { transcodeFilePath, segmentFileNames } }
      }
    } else {
      try {
        const response = await this.monitorProgress(task, func, job.data)
        return { response }
      } catch (e: any) {
        tracing.recordException(e)
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        logger.error(
          `Could not process taskType=${task} uuid=${
            logContext.requestID
          }: ${e.toString()}`,
          logContext
        )
        return e.toString()
      }
    }
  }

  // TODO: Make these jobs background processes

  async addTrackContentUploadTask(params: Omit<AddTaskParams, 'task'>) {
    return this.addTask({
      task: ProcessNames.trackContentUpload,
      ...params
    })
  }

  async addTranscodeAndSegmentTask(params: Omit<AddTaskParams, 'task'>) {
    return this.addTask({
      task: ProcessNames.transcodeAndSegment,
      ...params
    })
  }

  async addProcessTranscodeAndSegmentTask(params: Omit<AddTaskParams, 'task'>) {
    return this.addTask({
      task: ProcessNames.processTranscodeAndSegments,
      ...params
    })
  }

  async addTranscodeHandOffTask(params: Omit<AddTaskParams, 'task'>) {
    return this.addTask({
      task: ProcessNames.transcodeHandOff,
      ...params
    })
  }

  async addTask(params: AddTaskParams) {
    const { logContext, task } = params

    await logger.debug(
      `Adding ${task} task! uuid=${logContext.requestID}}`,
      logContext
    )

    const job = await this.queue.add(QUEUE_NAME, params)

    return job
  }

  /**
   * Depending on the task type, return the processing fn.
   *
   * @dev if this file gets any bigger, we should consider a factory class
   * @param {string} task a process in PROCESS_NAMES
   * @returns the processing fn
   */
  getFn(task: string) {
    switch (task) {
      // Called via /track_content_async route (runs on primary)
      case ProcessNames.trackContentUpload:
        return trackContentUpload

      // Called via /transcode_and_segment (running on node that has been handed off track)
      case ProcessNames.transcodeAndSegment:
        return transcodeAndSegment

      // Part 1 of transcode handoff flow - called via /track_content_async if currentNodeShouldHandleTranscode = false (runs on primary)
      case ProcessNames.transcodeHandOff:
        return transcodeHandOff

      // Part 2 of transcode handoff flow - called by process function in this queue after transcodeHandoff successfully runs (runs on primary)
      case ProcessNames.processTranscodeAndSegments:
        return processTranscodeAndSegments

      default:
        return null
    }
  }

  /**
   * Processes the input function and adds the response to redis. Tasks will either be in a
   * IN_PROGRESS, DONE, or FAILED state.
   * @param {string} task a process in PROCESS_NAMES
   * @param {function} func the processing fn
   * @param {Object} param
   * @param {Object} param.logContext
   * @param {Object} param.req the request associated with the func
   * @returns the expected response from the func
   */
  async monitorProgress(
    task: string,
    func: (...args: any) => any,
    { logContext, req }: { logContext: LogContext; req: Request }
  ) {
    const uuid = logContext.requestID
    const redisKey = this.constructAsyncProcessingKey(uuid)

    let state: {
      task: string
      status: ValuesOf<typeof ProcessStates>
      resp?: any
    } = { task, status: ProcessStates.IN_PROGRESS }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    logger.debug(`Starting ${task}, uuid=${uuid}`, logContext)
    await redisClient.set(
      redisKey,
      JSON.stringify(state),
      'EX',
      EXPIRATION_SECONDS
    )

    let response
    try {
      response = await func({ logContext }, { ...req, libs: this.libs })
      state = { task, status: ProcessStates.DONE, resp: response }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      logger.debug(`Successful ${task}, uuid=${uuid}`, logContext)
      await redisClient.set(
        redisKey,
        JSON.stringify(state),
        'EX',
        EXPIRATION_SECONDS
      )
    } catch (e: any) {
      state = { task, status: ProcessStates.FAILED, resp: e.message }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      logger.debug(
        `Error with ${task}. uuid=${uuid}} resp=${JSON.stringify(e.message)}`,
        logContext
      )
      await redisClient.set(
        redisKey,
        JSON.stringify(state),
        'EX',
        EXPIRATION_SECONDS
      )

      throw e
    }

    return response
  }

  /**
   * Given the jobs, create a count of the type of tasks.
   * @param {Object} jobs jobs returned from the queue
   * @returns {Object} the number of jobs per task
   * Example response:
   *
   * {
   *    trackContentUpload: 1,
   *    transcodeAndSegment: 4,
   *    processTranscodeAndSegments: 0,
   *    transcodeHandOff: 2
   *    total: 7
   * }
   *
   */
  getTasks(jobs: Job[]) {
    const response: Record<string, number> = {
      trackContentUpload: 0,
      transcodeAndSegment: 0,
      processTranscodeAndSegments: 0,
      transcodeHandOff: 0
    }

    jobs.forEach((job) => {
      response[job.data.task] += 1
    })

    response.total = jobs.length

    return response
  }

  async getAsyncProcessingQueueJobs() {
    const queue = this.queue
    const [waiting, active, failed] = await Promise.all([
      queue.getJobs(['waiting']),
      queue.getJobs(['active']),
      queue.getJobs(['failed'])
    ])

    const allTasks = {
      waiting: this.getTasks(waiting),
      active: this.getTasks(active),
      failed: this.getTasks(failed)
    }

    return allTasks
  }

  constructAsyncProcessingKey(uuid: string) {
    return `async:::${uuid}`
  }
}
