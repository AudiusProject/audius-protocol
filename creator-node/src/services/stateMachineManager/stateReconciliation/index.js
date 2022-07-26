const config = require('../../../config')
const {
  QUEUE_HISTORY,
  QUEUE_NAMES,
  MAX_QUEUE_RUNTIMES
} = require('../stateMachineConstants')
const { makeQueue, registerQueueEvents } = require('../stateMachineUtils')
const processJob = require('../processJob')
const { logger: baseLogger, createChildLogger } = require('../../../logging')
const handleSyncRequestJobProcessor = require('./issueSyncRequest.jobProcessor')
const updateReplicaSetJobProcessor = require('./updateReplicaSet.jobProcessor')

const recurringSyncLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.RECURRING_SYNC
})
const manualSyncLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.MANUAL_SYNC
})
const updateReplicaSetLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.UPDATE_REPLICA_SET
})

/**
 * Handles setup and job processing of the queue with jobs for:
 * - issuing sync requests to nodes (this can be other nodes or this node)
 * - updating user's replica sets when one or more nodes in their replica set becomes unhealthy
 */
class StateReconciliationManager {
  async init(prometheusRegistry) {
    const manualSyncQueue = makeQueue({
      name: QUEUE_NAMES.MANUAL_SYNC,
      removeOnComplete: QUEUE_HISTORY.MANUAL_SYNC,
      removeOnFail: QUEUE_HISTORY.MANUAL_SYNC,
      lockDuration: MAX_QUEUE_RUNTIMES.MANUAL_SYNC
    })

    const recurringSyncQueue = makeQueue({
      name: QUEUE_NAMES.RECURRING_SYNC,
      removeOnComplete: QUEUE_HISTORY.RECURRING_SYNC,
      removeOnFail: QUEUE_HISTORY.RECURRING_SYNC,
      lockDuration: MAX_QUEUE_RUNTIMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP
    })

    const updateReplicaSetQueue = makeQueue({
      name: QUEUE_NAMES.UPDATE_REPLICA_SET,
      removeOnComplete: QUEUE_HISTORY.UPDATE_REPLICA_SET,
      removeOnFail: QUEUE_HISTORY.UPDATE_REPLICA_SET,
      lockDuration: MAX_QUEUE_RUNTIMES.UPDATE_REPLICA_SET
    })

    // Clear any old state if redis was running but the rest of the server restarted
    await manualSyncQueue.clean({ force: true })
    await recurringSyncQueue.clean({ force: true })
    await updateReplicaSetQueue.clean({ force: true })

    this.registerQueueEventHandlersAndJobProcessors({
      manualSyncQueue,
      recurringSyncQueue,
      updateReplicaSetQueue,
      processManualSync:
        this.makeProcessManualSyncJob(prometheusRegistry).bind(this),
      processRecurringSync:
        this.makeProcessRecurringSyncJob(prometheusRegistry).bind(this),
      processUpdateReplicaSet:
        this.makeProcessUpdateReplicaSetJob(prometheusRegistry).bind(this)
    })

    return {
      manualSyncQueue,
      recurringSyncQueue,
      updateReplicaSetQueue
    }
  }

  /**
   * Registers event handlers for logging and job success/failure.
   * @param {Object} params.queue the queue to register events for
   * @param {Object} params.manualSyncQueue the manual sync queue
   * @param {Object} params.recurringSyncQueue the recurring sync queue
   * @param {Object} params.updateReplicaSetQueue the updateReplicaSetQueue queue
   * @param {Function<job>} params.processManualSync the function to call when processing a manual sync job from the queue
   * @param {Function<job>} params.processRecurringSync the function to call when processing a recurring sync job from the queue
   * @param {Function<job>} params.processUpdateReplicaSet the function to call when processing an update-replica-set job from the queue
   */
  registerQueueEventHandlersAndJobProcessors({
    manualSyncQueue,
    recurringSyncQueue,
    updateReplicaSetQueue,
    processManualSync,
    processRecurringSync,
    processUpdateReplicaSet
  }) {
    // Add handlers for logging
    registerQueueEvents(manualSyncQueue, manualSyncLogger)
    registerQueueEvents(recurringSyncQueue, recurringSyncLogger)
    registerQueueEvents(updateReplicaSetQueue, updateReplicaSetLogger)

    // Log when a job fails to complete
    manualSyncQueue.on('failed', (job, err) => {
      const logger = createChildLogger(manualSyncLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
    })
    recurringSyncQueue.on('failed', (job, err) => {
      const logger = createChildLogger(recurringSyncLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
    })
    updateReplicaSetQueue.on('failed', (job, err) => {
      const logger = createChildLogger(updateReplicaSetLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
    })

    // Register the logic that gets executed to process each new job from the queue
    manualSyncQueue.process(
      config.get('maxManualRequestSyncJobConcurrency'),
      processManualSync
    )

    recurringSyncQueue.process(
      config.get('maxRecurringRequestSyncJobConcurrency'),
      processRecurringSync
    )
    updateReplicaSetQueue.process(1 /** concurrency */, processUpdateReplicaSet)
  }

  /*
   * Job processor boilerplate
   */

  makeProcessManualSyncJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        job,
        handleSyncRequestJobProcessor,
        manualSyncLogger,
        prometheusRegistry
      )
  }

  makeProcessRecurringSyncJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        job,
        handleSyncRequestJobProcessor,
        recurringSyncLogger,
        prometheusRegistry
      )
  }

  makeProcessUpdateReplicaSetJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        job,
        updateReplicaSetJobProcessor,
        updateReplicaSetLogger,
        prometheusRegistry
      )
  }
}

module.exports = StateReconciliationManager
