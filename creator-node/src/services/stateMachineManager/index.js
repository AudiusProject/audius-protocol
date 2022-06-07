const _ = require('lodash')

const config = require('../../config')
const { logger: baseLogger, createChildLogger } = require('../../logging')
const StateMonitoringQueue = require('./stateMonitoring/StateMonitoringQueue')
const StateReconciliationQueue = require('./stateReconciliation/StateReconciliationQueue')
const NodeToSpIdManager = require('./CNodeToSpIdMapManager')
const { RECONFIG_MODES, QUEUE_NAMES } = require('./stateMachineConstants')
const QueueInterfacer = require('./QueueInterfacer')

/**
 * Manages the queue for monitoring the state of Content Nodes and
 * the queue for reconciling anomalies in the state (syncs and replica set updates).
 * Use QueueInterfacer for interfacing with the queues.
 */
class StateMachineManager {
  async init(audiusLibs) {
    this.updateEnabledReconfigModesSet()

    // TODO: Decide on interval to run this on
    try {
      NodeToSpIdManager.updateCnodeEndpointToSpIdMap(audiusLibs.ethContracts)

      // Update enabledReconfigModesSet after successful `updateCnodeEndpointToSpIdMap()` call
      this.updateEnabledReconfigModesSet()
    } catch (e) {
      // Disable reconfig after failed update
      this.updateEnabledReconfigModesSet(
        /* override */ RECONFIG_MODES.RECONFIG_DISABLED.key
      )
      baseLogger.error(`updateEndpointToSpIdMap Error: ${e.message}`)
    }

    // Initialize queues
    const stateMonitoringQueue = new StateMonitoringQueue()
    const stateReconciliationQueue = new StateReconciliationQueue()
    const stateMonitoringQueueQueue = await stateMonitoringQueue.init(
      audiusLibs.discoveryProvider.discoveryProviderEndpoint
    )
    const stateReconciliationQueueQueue = await stateReconciliationQueue.init()

    // Make jobs enqueue other jobs as necessary upon completion
    stateMonitoringQueueQueue.on(
      'global:completed',
      this._makeEnqueueJobsOnCompletion(
        stateMonitoringQueueQueue,
        stateReconciliationQueueQueue
      ).bind(this)
    )
    stateReconciliationQueueQueue.on(
      'global:completed',
      this._makeEnqueueJobsOnCompletion(
        stateMonitoringQueueQueue,
        stateReconciliationQueueQueue
      ).bind(this)
    )

    // TODO: Remove this and libs another way -- maybe init a new instance for each updateReplicaSet job
    QueueInterfacer.init(audiusLibs)

    return {
      stateMonitoringQueue: stateMonitoringQueueQueue,
      stateReconciliationQueue: stateReconciliationQueueQueue
    }
  }

  /**
   * Updates `enabledReconfigModesSet` and `highestEnabledReconfigMode`.
   * Uses `override` if provided, else uses config var.
   * `enabledReconfigModesSet` contains every mode with rank <= `highestEnabledReconfigMode`
   *   - e.g. `highestEnabledReconfigMode = 'PRIMARY_AND_SECONDARY'
   *      `enabledReconfigModesSet = { 'RECONFIG_DISABLED', 'ONE_SECONDARY', 'MULTIPLE_SECONDARIES', 'PRIMARY_AND_SECONDARY' }
   */
  updateEnabledReconfigModesSet(override) {
    let highestEnabledReconfigMode

    const reconfigModeKeys = Object.keys(RECONFIG_MODES)

    // Set mode to override if provided
    if (override) {
      highestEnabledReconfigMode = override

      // Else, set mode to config var, defaulting to RECONFIG_DISABLED if invalid
    } else {
      highestEnabledReconfigMode = reconfigModeKeys.includes(
        config.get('snapbackHighestReconfigMode')
      )
        ? config.get('snapbackHighestReconfigMode')
        : RECONFIG_MODES.RECONFIG_DISABLED.key
    }

    // All modes with lower rank than `highestEnabledReconfigMode` should be enabled
    const enabledReconfigModesSet = new Set(
      reconfigModeKeys.filter(
        (mode) =>
          RECONFIG_MODES[mode].value <=
          RECONFIG_MODES[highestEnabledReconfigMode].value
      )
    )

    // Update class variables for external access
    this.highestEnabledReconfigMode = highestEnabledReconfigMode
    this.enabledReconfigModesSet = enabledReconfigModesSet
  }

  _makeEnqueueJobsOnCompletion(monitoringQueue, reconciliationQueue) {
    return async function (jobId, resultString) {
      const logger = createChildLogger(baseLogger, { jobId })

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

      const monitoringJobs = jobsToEnqueue[QUEUE_NAMES.STATE_MONITORING] || []
      const reconciliationJobs =
        jobsToEnqueue[QUEUE_NAMES.STATE_RECONCILIATION] || []
      logger.info(
        `Attempting to enqueue ${monitoringJobs?.length} monitoring jobs and ${reconciliationJobs.length} reconciliation jobs in bulk`
      )

      try {
        const monitoringBulkAddResult = await monitoringQueue.addBulk(
          monitoringJobs.map((job) => {
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
      try {
        const reconciliationBulkAddResult = await reconciliationQueue.addBulk(
          reconciliationJobs.map((job) => {
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
}

module.exports = StateMachineManager
