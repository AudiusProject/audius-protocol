const { logger: baseLogger, createChildLogger } = require('../../logging')
const { QUEUE_NAMES } = require('./stateMachineConstants')
const {
  METRIC_RECORD_TYPE
} = require('../prometheusMonitoring/prometheus.constants')

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
 * @dev MUST be bound to a class containing an `enabledReconfigModes` property.
 *      See usage in index.js (in same directory) for example of how it's bound to StateMachineManager.
 *
 * @param {Object} queueNameToQueueMap mapping of queue name (string) to queue object (BullQueue)
 * @param {Object} prometheusRegistry the registry of prometheus metrics
 * @returns a function that:
 * - takes a jobId (string) and result (string) of a job that successfully completed
 * - parses the result (string) into JSON
 * - bulk-enqueues all jobs under result[QUEUE_NAMES.STATE_MONITORING] into the state monitoring queue
 * - bulk-enqueues all jobs under result[QUEUE_NAMES.STATE_RECONCILIATION] into the state reconciliation queue
 * - records metrics from result.metricsToRecord
 */
module.exports = function (queueNameToQueueMap, prometheusRegistry) {
  return async function (jobId, resultString) {
    // Create a logger so that we can filter logs by the tag `jobId` = <id of the job that successfully completed>
    const logger = createChildLogger(baseLogger, { jobId })

    // update-replica-set jobs need enabledReconfigModes as an array.
    // `this` comes from the function being bound via .bind() to ./index.js
    if (!this?.hasOwnProperty('enabledReconfigModesSet')) {
      logger.error(
        'Function was supposed to be bound to StateMachineManager to access enabledReconfigModesSet! Update replica set jobs will not be able to process!'
      )
      return
    }
    const enabledReconfigModes = Array.from(this.enabledReconfigModesSet)

    // Bull serializes the job result into redis, so we have to deserialize it into JSON
    let jobResult = {}
    try {
      logger.info(`Job successfully completed. Parsing result: ${resultString}`)
      jobResult = JSON.parse(resultString) || {}
    } catch (e) {
      logger.error(`Failed to parse job result string: ${e.message}`)
      return
    }

    const { jobsToEnqueue, metricsToRecord } = jobResult

    // Enqueue jobs into each queue
    for (const [queueName, queueJobs] of Object.entries(jobsToEnqueue || {})) {
      // Make sure we're working with a valid queue
      const queue = queueNameToQueueMap[queueName]
      if (!queue) {
        logger.error(
          `Job returned data trying to enqueue jobs to a queue whose name isn't recognized: ${queueName}`
        )
        continue
      }

      // Sanitize job data and inject fields into jobs if the queue requires extra data
      let decoratedJobs = queueJobs
      if (queueName === QUEUE_NAMES.UPDATE_REPLICA_SET) {
        decoratedJobs = injectEnabledReconfigModes(
          queueJobs,
          enabledReconfigModes
        )
      }

      await enqueueJobs(decoratedJobs, queue, queueName, jobId, logger)
    }

    recordMetrics(prometheusRegistry, logger, metricsToRecord)
  }
}

const enqueueJobs = async (
  jobs,
  queue,
  queueName,
  triggeredByJobId,
  logger
) => {
  logger.info(
    `Attempting to add ${jobs?.length} jobs in bulk to queue ${queueName}`
  )

  // Transform output into the job format that Bull expects for bulkAdd and add 'enqueuedBy' field for tracking
  try {
    const bulkAddResult = await queue.addBulk(
      jobs.map((job) => {
        return {
          data: { enqueuedBy: `${queueName}#${triggeredByJobId}`, ...job }
        }
      })
    )
    logger.info(
      `Added ${bulkAddResult.length} jobs to ${queueName} in bulk after successful completion`
    )
  } catch (e) {
    logger.error(
      `Failed to bulk-add jobs to ${queueName} after successful completion: ${e}`
    )
  }
}

// Injects enabledReconfigModes into update-replica-set jobs
const injectEnabledReconfigModes = (jobs, enabledReconfigModes) => {
  return jobs.map((job) => {
    return { ...job, enabledReconfigModes }
  })
}

const recordMetrics = (prometheusRegistry, logger, metricsToRecord = []) => {
  for (const metricInfo of metricsToRecord) {
    try {
      const { metricName, metricType, metricValue, metricLabels } = metricInfo
      const metric = prometheusRegistry.getMetric(metricName)
      if (metricType === METRIC_RECORD_TYPE.HISTOGRAM_OBSERVE) {
        metric.observe(metricLabels, metricValue)
      } else if (metricType === METRIC_RECORD_TYPE.GAUGE_INC) {
        metric.inc(metricLabels, metricValue)
      } else {
        logger.error(`Unexpected metric type: ${metricType}`)
      }
    } catch (error) {
      logger.error(`Error recording metric ${metricInfo}: ${error}`)
    }
  }
}
