const BullQueue = require('bull')

const config = require('../../../config')
const {
  QUEUE_HISTORY,
  QUEUE_NAMES,
  JOB_NAMES,
  STATE_RECONCILIATION_QUEUE_MAX_JOB_RUNTIME_MS,
  MANUAL_SYNC_QUEUE_MAX_JOB_RUNTIME_MS
} = require('../stateMachineConstants')
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
    const stateReconciliationQueue = this.makeQueue({
      redisHost: config.get('redisHost'),
      redisPort: config.get('redisPort'),
      name: QUEUE_NAMES.STATE_RECONCILIATION,
      removeOnComplete: QUEUE_HISTORY.STATE_RECONCILIATION,
      removeOnFail: QUEUE_HISTORY.STATE_RECONCILIATION,
      lockDuration: STATE_RECONCILIATION_QUEUE_MAX_JOB_RUNTIME_MS
    })

    const manualSyncQueue = this.makeQueue({
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

  makeQueue({
    redisHost,
    redisPort,
    name,
    removeOnComplete,
    removeOnFail,
    lockDuration
  }) {
    // Settings config from https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#advanced-settings
    return new BullQueue(name, {
      redis: {
        host: redisHost,
        port: redisPort
      },
      defaultJobOptions: {
        removeOnComplete: removeOnComplete,
        removeOnFail: removeOnFail
      },
      settings: {
        // Should be sufficiently larger than expected job runtime
        lockDuration: lockDuration,
        // We never want to re-process stalled jobs
        maxStalledCount: 0
      }
    })
  }

  /**
   * Registers event handlers for logging and job success/failure.
   * @param {Object} params.queue the queue to register events for
   * @param {Function<queue, successfulJob, jobResult>} params.jobSuccessCallback the function to call when a job succeeds
   * @param {Function<queue, failedJob>} params.jobFailureCallback the function to call when a job fails
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
    stateReconciliationQueue.on('global:waiting', (jobId) => {
      const logger = createChildLogger(reconciliationLogger, { jobId })
      logger.info('Job waiting')
    })
    stateReconciliationQueue.on('global:active', (jobId, jobPromise) => {
      const logger = createChildLogger(reconciliationLogger, { jobId })
      logger.info('Job active')
    })
    stateReconciliationQueue.on(
      'global:lock-extension-failed',
      (jobId, err) => {
        const logger = createChildLogger(stateReconciliationQueue, { jobId })
        logger.error(`Job lock extension failed. Error: ${err}`)
      }
    )
    stateReconciliationQueue.on('global:stalled', (jobId) => {
      const logger = createChildLogger(stateReconciliationQueue, { jobId })
      logger.error('Job stalled')
    })
    stateReconciliationQueue.on('global:error', (error) => {
      reconciliationLogger.error(`Queue Job Error - ${error}`)
    })

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
