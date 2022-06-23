const { logger: baseLogger, createChildLogger } = require('../../logging')
const { QUEUE_NAMES, JOB_NAMES } = require('./stateMachineConstants')

/**
 * Higher order function that creates a function that can be used as a Bull Queue onComplete callback to take
 * a job that successfully completed and read its output for new jobs that will be enqueued in bulk.
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
 * @returns a function that:
 * - takes a jobId (string) and result (string) of a job that successfully completed
 * - parses the result (string) into JSON
 * - bulk-enqueues all jobs under result[QUEUE_NAMES.STATE_MONITORING] into the state monitoring queue
 * - bulk-enqueues all jobs under result[QUEUE_NAMES.STATE_RECONCILIATION] into the state reconciliation queue
 */
module.exports = function makeCompletedJobEnqueueOtherJobs(
  monitoringQueue,
  reconciliationQueue
) {
  return async function (jobId, resultString) {
    // Create a logger so that we can filter logs by the tag `jobId` = <id of the job that successfully completed>
    const logger = createChildLogger(baseLogger, { jobId })

    // Bull serializes the job result into redis, so we have to deserialize it into JSON
    let jobsToEnqueue = {}
    try {
      jobsToEnqueue = JSON.parse(resultString)?.jobsToEnqueue
      if (!jobsToEnqueue) {
        logger.info(
          `No jobs to enqueue after successful completion. Result: ${resultString}`
        )
        return
      }
    } catch (e) {
      logger.warn(`Failed to parse job result string: ${resultString}`)
      return
    }

    // Find all monitoring and reconciliation jobs
    const monitoringJobs = jobsToEnqueue[QUEUE_NAMES.STATE_MONITORING] || []
    const reconciliationJobs =
      jobsToEnqueue[QUEUE_NAMES.STATE_RECONCILIATION] || []
    logger.info(
      `Attempting to enqueue ${monitoringJobs?.length} monitoring jobs and ${reconciliationJobs.length} reconciliation jobs in bulk`
    )

    // Enqueue all monitoring jobs in bulk after renaming properties to what Bull expects (name and data)
    try {
      const monitoringBulkAddResult = await monitoringQueue.addBulk(
        monitoringJobs.map((job) => {
          if (!job?.jobName || !job?.jobData) {
            logger.error(`Job ${JSON.stringify(job)} is missing name or data!`)
          }
          return { name: job.jobName, data: job.jobData }
        })
      )
      logger.info(
        `Enqueued ${monitoringBulkAddResult.length} monitoring jobs in bulk after successful completion`
      )
    } catch (e) {
      logger.error(
        `Failed to bulk-enqueue monitoring jobs after successful completion: ${e}`
      )
    }

    // Enqueue all reconciliation jobs in bulk after renaming properties to what Bull expects (name and data)
    try {
      const reconciliationBulkAddResult = await reconciliationQueue.addBulk(
        reconciliationJobs.map((job) => {
          if (!job?.jobName || !job?.jobData) {
            logger.error(`Job ${JSON.stringify(job)} is missing name or data!`)
          }
          // Inject enabledReconfigModesSet into update-replica-set jobs as an array.
          // It gets `this` from being bound to ./index.js
          if (job.jobName === JOB_NAMES.UPDATE_REPLICA_SET) {
            if (this?.hasOwnProperty('enabledReconfigModesSet')) {
              job.jobData = {
                ...job.jobData,
                enabledReconfigModes: Array.from(this.enabledReconfigModesSet)
              }
            } else {
              logger.error(
                'Function was supposed to be bound to StateMachineManager to access enabledReconfigModesSet! Update replica set jobs will not be able to process!'
              )
            }
          }
          return { name: job.jobName, data: job.jobData }
        })
      )
      logger.info(
        `Enqueued ${reconciliationBulkAddResult.length} reconciliation jobs in bulk after successful completion`
      )
    } catch (e) {
      logger.error(
        `Failed to bulk-enqueue reconciliation jobs after successful completion: ${e}`
      )
    }
  }
}
