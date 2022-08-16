import type Logger from 'bunyan'
import type {
  AnyDecoratedJobParams,
  AnyDecoratedJobReturnValue,
  AnyJobParams
} from './types'
import _ from 'lodash'

import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import { SpanStatusCode } from '@opentelemetry/api'

import { createChildLogger } from '../../logging'
import redis from '../../redis'
import { QUEUE_NAMES } from './stateMachineConstants'
import { getActiveSpan, instrumentTracing } from '../../utils/tracing'

/**
 * Higher order function to wrap a job processor with a logger and a try-catch.
 *
 * @param {Object{id, data}} job `job.id` is used to filter by `jobId` tag in the logger
 * @param {Function<logger, args>} jobProcessor the processor function that takes a logger and then the contents `job.data` as its args
 * @param {Object} parentLogger the base logger so that queries can filter by its properties as well
 * @param {Object} prometheusRegistry the registry for prometheus to log metrics
 * @returns the result of the completed job, or an object with an error property if the job throws
 */
const processJob = async function (
  job: { id: string; data: AnyJobParams },
  jobProcessor: (job: AnyDecoratedJobParams) => AnyDecoratedJobReturnValue,
  parentLogger: Logger,
  prometheusRegistry: any
) {
  const span = getActiveSpan()

  // Make sure logger has `queue` property
  const queueName = parentLogger?.fields?.queue
  if (!queueName) {
    parentLogger.error(
      `Missing required queue property on logger for job ${job}`
    )
    throw new Error('Missing required queue property on logger!')
  }

  const { id: jobId, data: jobData } = job
  span?.setAttribute('jobId', jobId)

  const jobLogger = createChildLogger(parentLogger, { jobId }) as Logger
  jobLogger.info(`New job: ${JSON.stringify(job)}`)

  let result
  const jobDurationSecondsHistogram = prometheusRegistry.getMetric(
    prometheusRegistry.metricNames[
      `STATE_MACHINE_${queueName}_JOB_DURATION_SECONDS_HISTOGRAM`
    ]
  )
  const metricEndTimerFn = jobDurationSecondsHistogram.startTimer()
  try {
    await redis.set(`latestJobStart_${queueName}`, Date.now())
    result = await jobProcessor({ logger: jobLogger, ...jobData })
    metricEndTimerFn({
      uncaughtError: false,
      ...getLabels(queueName, result)
    })
    await redis.set(`latestJobSuccess_${queueName}`, Date.now())
  } catch (error) {
    span?.recordException(error as Error)
    span?.setStatus({ code: SpanStatusCode.ERROR })
    jobLogger.error(`Error processing job: ${error}`)
    jobLogger.error((error as Error).stack)
    result = { error: (error as Error).message || `${error}` }
    metricEndTimerFn({ uncaughtError: true })
  }

  return result
}

/**
 * Creates prometheus label names and values that are specific to the given job type and its results.
 * @param {string} jobName the name of the job to generate metrics for
 * @param {Object} jobResult the result of the job to generate metrics for
 */
const getLabels = (jobName: string, jobResult: any) => {
  if (jobName === QUEUE_NAMES.UPDATE_REPLICA_SET) {
    const { issuedReconfig, newReplicaSet } = jobResult
    return {
      issuedReconfig: issuedReconfig || 'false',
      reconfigType: _.snakeCase(newReplicaSet?.reconfigType || 'null')
    }
  }
  return {}
}

module.exports = instrumentTracing({
  fn: processJob,
  options: {
    attributes: {
      [SemanticAttributes.CODE_FILEPATH]: __filename
    }
  }
})
