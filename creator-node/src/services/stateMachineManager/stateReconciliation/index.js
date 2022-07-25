const BullQueue = require('bull')

const config = require('../../../config')
const {
  QUEUE_HISTORY,
  QUEUE_NAMES,
  JOB_NAMES,
  STATE_RECONCILIATION_QUEUE_MAX_JOB_RUNTIME_MS
} = require('../stateMachineConstants')
const processJob = require('../processJob')
const { logger: baseLogger, createChildLogger } = require('../../../logging')
const handleSyncRequestJobProcessor = require('./issueSyncRequest.jobProcessor')
const updateReplicaSetJobProcessor = require('./updateReplicaSet.jobProcessor')

const logger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.STATE_RECONCILIATION
})

/**
 * Handles setup and job processing of the queue with jobs for:
 * - issuing sync requests to nodes (this can be other nodes or this node)
 * - updating user's replica sets when one or more nodes in their replica set becomes unhealthy
 */
class StateReconciliationManager {
  async init(prometheusRegistry) {
    const queue = this.makeQueue(
      config.get('redisHost'),
      config.get('redisPort')
    )
    this.registerQueueEventHandlersAndJobProcessors({
      queue,
      processManualSync:
        this.makeProcessManualSyncJob(prometheusRegistry).bind(this),
      processRecurringSync:
        this.makeProcessRecurringSyncJob(prometheusRegistry).bind(this),
      processUpdateReplicaSet:
        this.makeProcessUpdateReplicaSetJob(prometheusRegistry).bind(this)
    })

    // Clear any old state if redis was running but the rest of the server restarted
    await queue.obliterate({ force: true })

    return queue
  }

  makeQueue(redisHost, redisPort) {
    // Settings config from https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#advanced-settings
    return new BullQueue(QUEUE_NAMES.STATE_RECONCILIATION, {
      redis: {
        host: redisHost,
        port: redisPort
      },
      defaultJobOptions: {
        removeOnComplete: QUEUE_HISTORY.RECONCILIATION_QUEUE_HISTORY,
        removeOnFail: QUEUE_HISTORY.RECONCILIATION_QUEUE_HISTORY
      },
      settings: {
        // Should be sufficiently larger than expected job runtime
        lockDuration: STATE_RECONCILIATION_QUEUE_MAX_JOB_RUNTIME_MS,
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
    queue,
    processManualSync,
    processRecurringSync,
    processUpdateReplicaSet
  }) {
    // Add handlers for logging
    queue.on('global:waiting', (jobId) => {
      logger.info(`Queue Job Waiting - ID ${jobId}`)
    })
    queue.on('global:active', (jobId, jobPromise) => {
      logger.info(`Queue Job Active - ID ${jobId}`)
    })
    queue.on('global:lock-extension-failed', (jobId, err) => {
      logger.error(
        `Queue Job Lock Extension Failed - ID ${jobId} - Error ${err}`
      )
    })
    queue.on('global:stalled', (jobId) => {
      logger.error(`stateMachineQueue Job Stalled - ID ${jobId}`)
    })
    queue.on('global:error', (error) => {
      logger.error(`Queue Job Error - ${error}`)
    })

    // Add handlers for when a job fails to complete (or completes with an error) or successfully completes
    queue.on('completed', (job, result) => {
      logger.info(
        `Queue Job Completed - ID ${job?.id} - Result ${JSON.stringify(result)}`
      )
    })
    queue.on('failed', (job, err) => {
      logger.error(`Queue Job Failed - ID ${job?.id} - Error ${err}`)
    })

    // Register the logic that gets executed to process each new job from the queue
    queue.process(
      JOB_NAMES.ISSUE_MANUAL_SYNC_REQUEST,
      config.get('maxManualRequestSyncJobConcurrency'),
      processManualSync
    )
    queue.process(
      JOB_NAMES.ISSUE_RECURRING_SYNC_REQUEST,
      config.get('maxRecurringRequestSyncJobConcurrency'),
      processRecurringSync
    )
    queue.process(
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
        logger,
        prometheusRegistry
      )
  }

  makeProcessRecurringSyncJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        JOB_NAMES.ISSUE_RECURRING_SYNC_REQUEST,
        job,
        handleSyncRequestJobProcessor,
        logger,
        prometheusRegistry
      )
  }

  makeProcessUpdateReplicaSetJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        JOB_NAMES.UPDATE_REPLICA_SET,
        job,
        updateReplicaSetJobProcessor,
        logger,
        prometheusRegistry
      )
  }
}

module.exports = StateReconciliationManager
