const BullQueue = require('bull')
const _ = require('lodash')

const config = require('../../../config')
const {
  QUEUE_HISTORY,
  STATE_RECONCILIATION_QUEUE_NAME,
  STATE_RECONCILIATION_QUEUE_MAX_JOB_RUNTIME_MS,
  HANDLE_MANUAL_SYNC_REQUEST_QUEUE_NAME,
  HANDLE_RECURRING_SYNC_REQUEST_QUEUE_NAME,
  ISSUE_SYNC_REQUESTS_QUEUE_NAME,
  UPDATE_REPLICA_SETS_QUEUE_NAME,
  SyncType
} = require('../stateMachineConstants')
const { logger } = require('../../../logging')
const processIssueSyncRequestsJob = require('./processIssueSyncRequestsJob')
const processExecuteSyncJob = require('./handleSyncRequest.jobProcessor')
const processUpdateReplicaSetsJob = require('./processUpdateReplicaSetsJob')

/**
 * Handles setup and lifecycle management (adding and processing jobs)
 * of the queue with jobs for:
 * - issuing sync requests to nodes (this can be other nodes or this node)
 * - executing syncs from these requests
 * - updating user's replica sets when one or more nodes in their replica set becomes unhealthy
 */
class StateReconciliationQueue {
  async init() {
    this.queue = this.makeQueue(
      config.get('redisHost'),
      config.get('redisPort')
    )
    this.registerQueueEventHandlersAndJobProcessor({
      queue: this.queue,
      processManualSync: this.processManualSyncJob,
      processRecurringSync: this.processRecurringSyncJob,
      processIssueSyncRequests: this.processIssueSyncRequestsJob,
      processUpdateReplicaSets: this.processUpdateReplicaSetsJob
    })

    // Clear any old state if redis was running but the rest of the server restarted
    await this.queue.obliterate({ force: true })
  }

  logDebug(msg) {
    logger.debug(`StateReconciliationQueue DEBUG: ${msg}`)
  }

  log(msg) {
    logger.info(`StateReconciliationQueue: ${msg}`)
  }

  logWarn(msg) {
    logger.warn(`StateReconciliationQueue WARNING: ${msg}`)
  }

  logError(msg) {
    logger.error(`StateReconciliationQueue ERROR: ${msg}`)
  }

  makeQueue(redisHost, redisPort) {
    // Settings config from https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#advanced-settings
    return new BullQueue(STATE_RECONCILIATION_QUEUE_NAME, {
      redis: {
        host: redisHost,
        port: redisPort
      },
      defaultJobOptions: {
        removeOnComplete: QUEUE_HISTORY,
        removeOnFail: QUEUE_HISTORY
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
   * @param {Function<job>} params.processIssueSyncRequests the function to call when processing an issue-sync-requests job from the queue
   * @param {Function<job>} params.processUpdateReplicaSet the function to call when processing an update-replica-set job from the queue
   */
  registerQueueEventHandlersAndJobProcessor({
    queue,
    processManualSync,
    processRecurringSync,
    processIssueSyncRequests,
    processUpdateReplicaSets
  }) {
    // Add handlers for logging
    queue.on('global:waiting', (jobId) => {
      this.log(`Queue Job Waiting - ID ${jobId}`)
    })
    queue.on('global:active', (jobId, jobPromise) => {
      this.log(`Queue Job Active - ID ${jobId}`)
    })
    queue.on('global:lock-extension-failed', (jobId, err) => {
      this.logError(
        `Queue Job Lock Extension Failed - ID ${jobId} - Error ${err}`
      )
    })
    queue.on('global:stalled', (jobId) => {
      this.logError(`stateMachineQueue Job Stalled - ID ${jobId}`)
    })
    queue.on('global:error', (error) => {
      this.logError(`Queue Job Error - ${error}`)
    })

    // Add handlers for when a job fails to complete (or completes with an error) or successfully completes
    queue.on('completed', (job, result) => {
      this.log(
        `Queue Job Completed - ID ${job?.id} - Result ${JSON.stringify(
          result
        )}. Queuing another job...`
      )
    })
    queue.on('failed', (job, err) => {
      this.logError(`Queue Job Failed - ID ${job?.id} - Error ${err}`)
    })

    // Register the logic that gets executed to process each new job from the queue
    queue.process(
      HANDLE_MANUAL_SYNC_REQUEST_QUEUE_NAME,
      config.get('maxManualRequestSyncJobConcurrency'),
      processManualSync
    )
    queue.process(
      HANDLE_RECURRING_SYNC_REQUEST_QUEUE_NAME,
      config.get('maxRecurringRequestSyncJobConcurrency'),
      processRecurringSync
    )
    queue.process(
      ISSUE_SYNC_REQUESTS_QUEUE_NAME,
      1 /** concurrency */,
      processIssueSyncRequests
    )
    queue.process(
      UPDATE_REPLICA_SETS_QUEUE_NAME,
      1 /** concurrency */,
      processUpdateReplicaSets
    )
  }

  async processManualSyncJob(job) {
    const { id: jobId, data: syncRequestParameters } = job

    this.log(
      `New manual sync job details: jobId=${jobId}, job=${JSON.stringify(job)}`
    )

    let result = {}
    try {
      result = await processExecuteSyncJob(
        jobId,
        SyncType.Manual,
        syncRequestParameters
      )
    } catch (error) {
      this.logError(`Error processing manual sync jobId ${jobId}: ${error}`)
      result = { error }
    }

    return result
  }

  async processRecurringSyncJob(job) {
    const { id: jobId, data: syncRequestParameters } = job

    this.log(
      `New recurring sync job details: jobId=${jobId}, job=${JSON.stringify(
        job
      )}`
    )

    let result = {}
    try {
      result = await processExecuteSyncJob(
        jobId,
        SyncType.Recurring,
        syncRequestParameters
      )
    } catch (error) {
      this.logError(`Error processing recurring sync jobId ${jobId}: ${error}`)
      result = { error }
    }

    return result
  }

  async processIssueSyncRequestsJob(job) {
    const {
      id: jobId,
      data: {
        users,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        replicaSetNodesToUserClockStatusesMap
      }
    } = job

    this.log(
      `New ${ISSUE_SYNC_REQUESTS_QUEUE_NAME} job details: jobId=${jobId}, job=${JSON.stringify(
        job
      )}`
    )

    let result = {}
    try {
      result = await processIssueSyncRequestsJob(
        jobId,
        users,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        replicaSetNodesToUserClockStatusesMap
      )
    } catch (error) {
      this.logError(
        `Error processing ${ISSUE_SYNC_REQUESTS_QUEUE_NAME} jobId ${jobId}: ${error}`
      )
      result = { error }
    }

    return result
  }

  async processUpdateReplicaSetsJob(job) {
    const {
      id: jobId,
      data: {
        users,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        replicaSetNodesToUserWalletsMap,
        replicaSetNodesToUserClockStatusesMap
      }
    } = job

    this.log(
      `New ${UPDATE_REPLICA_SETS_QUEUE_NAME} job details: jobId=${jobId}, job=${JSON.stringify(
        job
      )}`
    )

    let result = {}
    try {
      result = await processUpdateReplicaSetsJob(
        jobId,
        users,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        replicaSetNodesToUserWalletsMap,
        replicaSetNodesToUserClockStatusesMap
      )
    } catch (error) {
      this.logError(
        `Error processing ${UPDATE_REPLICA_SETS_QUEUE_NAME} jobId ${jobId}: ${error}`
      )
      result = { error }
    }

    return result
  }
}

module.exports = StateReconciliationQueue
