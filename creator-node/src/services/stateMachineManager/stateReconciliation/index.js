const config = require('../../../config')
const {
  QUEUE_HISTORY,
  QUEUE_NAMES,
  JOB_NAMES,
  STATE_RECONCILIATION_QUEUE_MAX_JOB_RUNTIME_MS,
  MANUAL_SYNC_QUEUE_MAX_JOB_RUNTIME_MS
} = require('../stateMachineConstants')
const { makeQueue, registerQueueEvents } = require('../stateMachineUtils')
const processJob = require('../processJob')
const { logger: baseLogger, createChildLogger } = require('../../../logging')
const handleSyncRequestJobProcessor = require('./issueSyncRequest.jobProcessor')
const updateReplicaSetJobProcessor = require('./updateReplicaSet.jobProcessor')

const reconciliationLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.STATE_RECONCILIATION
})

const manualSyncLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.MANUAL_SYNC
})

/**
 * Handles setup and job processing of the queue with jobs for:
 * - issuing sync requests to nodes (this can be other nodes or this node)
 * - updating user's replica sets when one or more nodes in their replica set becomes unhealthy
 */
class StateReconciliationManager {
  async init(prometheusRegistry) {
    const stateReconciliationQueue = makeQueue({
      redisHost: config.get('redisHost'),
      redisPort: config.get('redisPort'),
      name: QUEUE_NAMES.STATE_RECONCILIATION,
      removeOnComplete: QUEUE_HISTORY.STATE_RECONCILIATION,
      removeOnFail: QUEUE_HISTORY.STATE_RECONCILIATION,
      lockDuration: STATE_RECONCILIATION_QUEUE_MAX_JOB_RUNTIME_MS
    })

    const manualSyncQueue = makeQueue({
      redisHost: config.get('redisHost'),
      redisPort: config.get('redisPort'),
      name: QUEUE_NAMES.MANUAL_SYNC,
      removeOnComplete: QUEUE_HISTORY.MANUAL_SYNC,
      removeOnFail: QUEUE_HISTORY.MANUAL_SYNC,
      lockDuration: MANUAL_SYNC_QUEUE_MAX_JOB_RUNTIME_MS
    })

    this.registerQueueEventHandlersAndJobProcessors({
      stateReconciliationQueue,
      manualSyncQueue,
      processManualSync:
        this.makeProcessManualSyncJob(prometheusRegistry).bind(this),
      processRecurringSync:
        this.makeProcessRecurringSyncJob(prometheusRegistry).bind(this),
      processUpdateReplicaSet:
        this.makeProcessUpdateReplicaSetJob(prometheusRegistry).bind(this)
    })

    // Clear any old state if redis was running but the rest of the server restarted
    await stateReconciliationQueue.clean({ force: true })
    await manualSyncQueue.clean({ force: true })

    return {
      stateReconciliationQueue,
      manualSyncQueue
    }
  }

  /**
   * Registers event handlers for logging and job success/failure.
   * @param {Object} params.queue the queue to register events for
   * @param {Object} params.stateReconciliationQueue the state reconciliation queue
   * @param {Object} params.manualSyncQueue the manual sync queue
   * @param {Function<job>} params.processManualSync the function to call when processing a manual sync job from the queue
   * @param {Function<job>} params.processRecurringSync the function to call when processing a recurring sync job from the queue
   * @param {Function<job>} params.processUpdateReplicaSet the function to call when processing an update-replica-set job from the queue
   */
  registerQueueEventHandlersAndJobProcessors({
    stateReconciliationQueue,
    manualSyncQueue,
    processManualSync,
    processRecurringSync,
    processUpdateReplicaSet
  }) {
    // Add handlers for logging
    registerQueueEvents(stateReconciliationQueue, reconciliationLogger)
    registerQueueEvents(manualSyncQueue, manualSyncLogger)

    // Log when a job fails to complete
    stateReconciliationQueue.on('failed', (job, err) => {
      const logger = createChildLogger(reconciliationLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
    })
    manualSyncQueue.on('failed', (job, err) => {
      const logger = createChildLogger(manualSyncLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
    })

    // Register the logic that gets executed to process each new job from the queue
    manualSyncQueue.process(
      JOB_NAMES.ISSUE_MANUAL_SYNC_REQUEST,
      config.get('maxManualRequestSyncJobConcurrency'),
      processManualSync
    )
    stateReconciliationQueue.process(
      JOB_NAMES.ISSUE_RECURRING_SYNC_REQUEST,
      config.get('maxRecurringRequestSyncJobConcurrency'),
      processRecurringSync
    )
    stateReconciliationQueue.process(
      JOB_NAMES.UPDATE_REPLICA_SET,
      1 /** concurrency */,
      processUpdateReplicaSet
    )
  }

  /*
   * Job processor boilerplate
   */

  makeProcessManualSyncJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        JOB_NAMES.ISSUE_MANUAL_SYNC_REQUEST,
        job,
        handleSyncRequestJobProcessor,
        manualSyncLogger,
        prometheusRegistry
      )
  }

  makeProcessRecurringSyncJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        JOB_NAMES.ISSUE_RECURRING_SYNC_REQUEST,
        job,
        handleSyncRequestJobProcessor,
        reconciliationLogger,
        prometheusRegistry
      )
  }

  makeProcessUpdateReplicaSetJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        JOB_NAMES.UPDATE_REPLICA_SET,
        job,
        updateReplicaSetJobProcessor,
        reconciliationLogger,
        prometheusRegistry
      )
  }
}

module.exports = StateReconciliationManager
