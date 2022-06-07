const BullQueue = require('bull')

const config = require('../../../config')
const {
  RECONCILIATION_QUEUE_HISTORY,
  QUEUE_NAMES,
  JOB_NAMES,
  STATE_RECONCILIATION_QUEUE_MAX_JOB_RUNTIME_MS
} = require('../stateMachineConstants')
const { processJob } = require('../stateMachineUtils')
const { logger: baseLogger, createChildLogger } = require('../../../logging')
const handleSyncRequestJobProcessor = require('./issueSyncRequest.jobProcessor')
const updateReplicaSetJobProcessor = require('./updateReplicaSet.jobProcessor')

const logger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.STATE_RECONCILIATION
})

/**
 * Handles setup and lifecycle management (adding and processing jobs)
 * of the queue with jobs for:
 * - issuing sync requests to nodes (this can be other nodes or this node)
 * - executing syncs from these requests
 * - updating user's replica sets when one or more nodes in their replica set becomes unhealthy
 */
class StateReconciliationQueue {
  async init() {
    const queue = this.makeQueue(
      config.get('redisHost'),
      config.get('redisPort')
    )
    this.registerQueueEventHandlersAndJobProcessors({
      queue,
      processManualSync: this.processManualSyncJob.bind(this),
      processRecurringSync: this.processRecurringSyncJob.bind(this),
      processUpdateReplicaSets: this.processUpdateReplicaSetsJob.bind(this)
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
        removeOnComplete: RECONCILIATION_QUEUE_HISTORY,
        removeOnFail: RECONCILIATION_QUEUE_HISTORY
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
    processUpdateReplicaSets
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
      processUpdateReplicaSets
    )
  }

  /*
   * Job processor boilerplate
   */

  async processManualSyncJob(job) {
    return processJob(
      JOB_NAMES.ISSUE_MANUAL_SYNC_REQUEST,
      job,
      handleSyncRequestJobProcessor,
      logger
    )
  }

  async processRecurringSyncJob(job) {
    return processJob(
      JOB_NAMES.ISSUE_RECURRING_SYNC_REQUEST,
      job,
      handleSyncRequestJobProcessor,
      logger
    )
  }

  async processUpdateReplicaSetsJob(job) {
    return processJob(
      JOB_NAMES.UPDATE_REPLICA_SET,
      job,
      updateReplicaSetJobProcessor,
      logger
    )
  }
}

module.exports = StateReconciliationQueue
