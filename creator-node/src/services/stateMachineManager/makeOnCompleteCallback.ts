import type Logger from 'bunyan'
import type { Queue, BulkJobOptions } from 'bullmq'
import type {
  AnyJobParams,
  QueueNameToQueueMap,
  AnyDecoratedJobReturnValue,
  ParamsForJobsToEnqueue
} from './types'
import { TQUEUE_NAMES, SYNC_MODES } from './stateMachineConstants'

import { instrumentTracing, tracing } from '../../tracer'
import { recordMetrics } from '../prometheusMonitoring/prometheusUsageUtils'

const { logger: baseLogger, createChildLogger } = require('../../logging')

/**
 * Higher order function that creates a function that's used as a Bull Queue onComplete callback to take
 * a job that successfully completed and read its output for new jobs that will be enqueued in bulk as well
 * as metrics that will be recorded.
 * The expected syntax that a job result must output in order to for this function to enqueue more
 * jobs upon completion is:
 * {
 *   jobsToEnqueue: {
 *     [QUEUE_NAMES.STATE_MONITORING]: [
 *       { <object containing data that this job type expects> },
 *       ...
 *     ],
 *     [QUEUE_NAMES.STATE_RECONCILIATION]: [
 *       { <object containing data that this job type expects> },
 *       ...
 *     ]
 *   }
 * }
 *
 * @param {string} nameOfQueueWithCompletedJob the name of the queue that this onComplete callback is for
 * @param {Object} queueNameToQueueMap mapping of queue name (string) to queue object (BullQueue) and max jobs that are allowed to be waiting in the queue
 * @param {Object} prometheusRegistry the registry of prometheus metrics
 * @returns a function that:
 * - takes a jobId (string) and result (string) of a job that successfully completed
 * - parses the result (string) into JSON
 * - bulk-enqueues all jobs under result[QUEUE_NAMES.STATE_MONITORING] into the state monitoring queue
 * - bulk-enqueues all jobs under result[QUEUE_NAMES.STATE_RECONCILIATION] into the state reconciliation queue
 * - records metrics from result.metricsToRecord
 */
function makeOnCompleteCallback(
  nameOfQueueWithCompletedJob: TQUEUE_NAMES,
  queueNameToQueueMap: QueueNameToQueueMap,
  prometheusRegistry: any
) {
  return async function (
    {
      jobId,
      returnvalue
    }: { jobId: string; returnvalue: string | AnyDecoratedJobReturnValue },
    _id: string
  ) {
    // Create a logger so that we can filter logs by the tags `queue` and `jobId` = <id of the job that successfully completed>
    const logger = createChildLogger(baseLogger, {
      queue: nameOfQueueWithCompletedJob,
      jobId
    })

    // Bull serializes the job result into redis, so we have to deserialize it into JSON
    let jobResult: AnyDecoratedJobReturnValue
    try {
      logger.debug(`Job processor successfully completed. Parsing result`)
      if (typeof returnvalue === 'string' || returnvalue instanceof String) {
        jobResult = JSON.parse(returnvalue as string) || {}
      } else {
        jobResult = returnvalue || {}
      }
    } catch (e: any) {
      logger.error(`Failed to parse job result string: ${e.message}`)
      return
    }

    const { jobsToEnqueue, metricsToRecord } = jobResult

    // Enqueue jobs into each queue
    for (const [queueName, queueJobs] of Object.entries(
      jobsToEnqueue || {}
    ) as [TQUEUE_NAMES, ParamsForJobsToEnqueue[]][]) {
      // Make sure we're working with a valid queue
      const { queue, maxWaitingJobs } = queueNameToQueueMap[queueName]
      if (!queue) {
        logger.error(
          `Job returned data trying to enqueue jobs to a queue whose name isn't recognized: ${queueName}`
        )
        continue
      }

      // Don't await this because it might cause "missing lock for job" errors.
      // See https://github.com/OptimalBits/bull/issues/789#issuecomment-620324812
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      enqueueJobs(
        queueJobs as AnyJobParams[],
        queue,
        queueName,
        nameOfQueueWithCompletedJob,
        maxWaitingJobs,
        jobId,
        logger
      )
    }

    recordMetrics(prometheusRegistry, logger, metricsToRecord)
  }
}

const enqueueJobs = async (
  jobs: AnyJobParams[],
  queueToAddTo: Queue,
  queueNameToAddTo: TQUEUE_NAMES,
  triggeredByQueueName: TQUEUE_NAMES,
  maxWaitingJobs: number,
  triggeredByJobId: string,
  logger: Logger
) => {
  logger.debug(
    `Attempting to add ${jobs?.length} jobs in bulk to queue ${queueNameToAddTo}`
  )

  // Don't add to the queue if the queue is already backed up (i.e., it has too many waiting jobs)
  const numWaitingJobs = await queueToAddTo.getWaitingCount()
  if (numWaitingJobs > maxWaitingJobs) {
    logger.warn(
      `Queue ${queueNameToAddTo} already has ${numWaitingJobs} waiting jobs. Not adding any more jobs until ${maxWaitingJobs} or fewer jobs are waiting in this queue`
    )
    return
  }

  // Add 'enqueuedBy' field for tracking
  try {
    const bulkAddResult = await queueToAddTo.addBulk(
      jobs.map((job) => {
        const jobInfo: { name: any; data: any; opts?: BulkJobOptions } = {
          name: 'defaultName',
          data: {
            enqueuedBy: `${triggeredByQueueName}#${triggeredByJobId}`,
            ...job
          }
        }

        if (
          (job as any)?.syncMode === SYNC_MODES.MergePrimaryAndSecondary ||
          (job as any)?.syncMode === SYNC_MODES.MergePrimaryThenWipeSecondary
        ) {
          jobInfo.opts = { ...jobInfo.opts, lifo: true }
        }

        return jobInfo
      })
    )
    logger.debug(
      `Added ${bulkAddResult.length} jobs to ${queueNameToAddTo} in bulk after successful completion`
    )
  } catch (e: any) {
    logger.error(
      `Failed to bulk-add jobs to ${queueNameToAddTo} after successful completion: ${e}`
    )
  }
}

module.exports = instrumentTracing({
  name: 'onComplete bull queue callback',
  fn: makeOnCompleteCallback,
  options: {
    attributes: {
      [tracing.CODE_FILEPATH]: __filename
    }
  }
})
