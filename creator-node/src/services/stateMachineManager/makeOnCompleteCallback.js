const { logger: baseLogger, createChildLogger } = require('../../logging')
const { QUEUE_NAMES, JOB_NAMES } = require('./stateMachineConstants')

/**
 * Higher order function that creates a function that's used as a Bull Queue onComplete callback to take
 * a job that successfully completed and read its output for new jobs that will be enqueued in bulk as well
 * as metrics that will be recorded.
 * The expected syntax that a job result must output in order to for this function to enqueue more
 * jobs upon completion is:
 * {
 *   jobsToEnqueue: {
 *     [QUEUE_NAMES.STATE_MONITORING]: [
 *       {
 *         jobName: <any job name from JOB_NAMES constant>,
 *         jobData: <object containing data that this job type expects>
 *       },
 *       ...
 *     ],
 *     [QUEUE_NAMES.STATE_RECONCILIATION]: [
 *       {
 *         jobName: <any job name from JOB_NAMES constant>,
 *         jobData: <object containing data that this job type expects>
 *       },
 *       ...
 *     ]
 *   }
 * }
 * @dev MUST be bound to a class containing an `enabledReconfigModes` property.
 *      See usage in index.js (in same directory) for example of how it's bound to StateMachineManager.
 *
 * @param {BullQueue} monitoringQueue the queue that handles state monitoring jobs
 * @param {BullQueue} reconciliationQueue the queue that handles state reconciliation jobs
 * @param {Object} prometheusRegistry the registry of prometheus metrics
 * @returns a function that:
 * - takes a jobId (string) and result (string) of a job that successfully completed
 * - parses the result (string) into JSON
 * - bulk-enqueues all jobs under result[QUEUE_NAMES.STATE_MONITORING] into the state monitoring queue
 * - bulk-enqueues all jobs under result[QUEUE_NAMES.STATE_RECONCILIATION] into the state reconciliation queue
 */
module.exports = function (
  monitoringQueue,
  reconciliationQueue,
  prometheusRegistry
) {
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
      jobResult = JSON.parse(resultString) || {}
    } catch (e) {
      logger.warn(`Failed to parse job result string: ${resultString}`)
      return
    }

    const { jobsToEnqueue, metricsToRecord } = jobResult

    if (jobsToEnqueue) {
      // Enqueue monitoring jobs
      const monitoringJobs = jobsToEnqueue[QUEUE_NAMES.STATE_MONITORING] || []
      await enqueueMonitoringJobs(monitoringJobs, monitoringQueue, logger)

      // Enqueue reconciliation jobs
      const reconciliationJobs =
        jobsToEnqueue[QUEUE_NAMES.STATE_RECONCILIATION] || []
      await enqueueReconciliationJobs(
        reconciliationJobs,
        reconciliationQueue,
        enabledReconfigModes,
        logger
      )
    } else {
      logger.info(
        `No jobs to enqueue after successful completion. Result: ${resultString}`
      )
    }

    // Record metrics
    ;(metricsToRecord || []).forEach((metricInfo) => {
      try {
        const { metricName, metricType, metricValue, metricLabels } = metricInfo
        const metric = prometheusRegistry.getMetric(metricName)
        if (metricType === 'HISTOGRAM') {
          metric.observe(metricLabels, metricValue)
        } else if (metricType === 'GAUGE_INC') {
          metric.inc(metricLabels, metricValue)
        } else {
          logger.error(`Unexpected metric type: ${metricType}`)
        }
      } catch (error) {
        logger.error(`Error recording metric ${metricInfo}: ${error}`)
      }
    })
  }
}

const enqueueMonitoringJobs = async (jobs, monitoringQueue, logger) => {
  logger.info(`Attempting to enqueue ${jobs?.length} monitoring jobs in bulk`)

  // Sanitize and transform output into the job format that Bull expects
  try {
    const bulkAddResult = await monitoringQueue.addBulk(
      sanitizeAndTransformMonitoringJobs(jobs)
    )
    logger.info(
      `Enqueued ${bulkAddResult.length} monitoring jobs in bulk after successful completion`
    )
  } catch (e) {
    logger.error(
      `Failed to bulk-enqueue monitoring jobs after successful completion: ${e}`
    )
  }
}

// Rename properties from job output to properties that Bull expects (jobName+jobData => name+data)
const sanitizeAndTransformMonitoringJobs = (jobs, logger) => {
  return jobs.map((job) => {
    if (!job?.jobName || !job?.jobData) {
      logger.error(`Job ${JSON.stringify(job)} is missing name or data!`)
    }
    return { name: job.jobName, data: job.jobData }
  })
}

const enqueueReconciliationJobs = async (
  jobs,
  reconciliationQueue,
  enabledReconfigModes,
  logger
) => {
  logger.info(
    `Attempting to enqueue ${jobs?.length} reconciliation jobs in bulk`
  )

  // Sanitize and transform output into the job format that Bull expects. Also inject extra job data
  try {
    const bulkAddResult = await reconciliationQueue.addBulk(
      sanitizeAndTransformReconciliationJobs(jobs, enabledReconfigModes, logger)
    )
    logger.info(
      `Enqueued ${bulkAddResult.length} reconciliation jobs in bulk after successful completion`
    )
  } catch (e) {
    logger.error(
      `Failed to bulk-enqueue reconciliation jobs after successful completion: ${e}`
    )
  }
}

// Rename properties from job output to properties that Bull expects (jobName+jobData => name+data)
// Also inject enabledReconfigModes into update-replica-set jobs
const sanitizeAndTransformReconciliationJobs = (
  jobs,
  enabledReconfigModes,
  logger
) => {
  return jobs.map((job) => {
    if (!job?.jobName || !job?.jobData) {
      logger.error(`Job ${JSON.stringify(job)} is missing name or data!`)
    }
    // Inject enabledReconfigModesSet into update-replica-set jobs
    if (job.jobName === JOB_NAMES.UPDATE_REPLICA_SET) {
      job.jobData = {
        ...job.jobData,
        enabledReconfigModes
      }
    }
    return { name: job.jobName, data: job.jobData }
  })
}
