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
const recoverOrphanedDataJobProcessor =
  require('./recoverOrphanedData.jobProcessor').default

const recurringSyncLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.RECURRING_SYNC
})
const manualSyncLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.MANUAL_SYNC
})
const updateReplicaSetLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.UPDATE_REPLICA_SET
})

const recoverOrphanedDataLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.RECOVER_ORPHANED_DATA
})

/**
 * Handles setup and job processing of the queue with jobs for:
 * - issuing sync requests to nodes (this can be other nodes or this node)
 * - updating user's replica sets when one or more nodes in their replica set becomes unhealthy
 */
class StateReconciliationManager {
  async init(discoveryNodeEndpoint, prometheusRegistry) {
    const manualSyncQueue = makeQueue({
      name: QUEUE_NAMES.MANUAL_SYNC,
      removeOnComplete: QUEUE_HISTORY.MANUAL_SYNC,
      removeOnFail: QUEUE_HISTORY.MANUAL_SYNC,
      lockDuration: MAX_QUEUE_RUNTIMES.MANUAL_SYNC,
      prometheusRegistry
    })

    const recurringSyncQueue = makeQueue({
      name: QUEUE_NAMES.RECURRING_SYNC,
      removeOnComplete: QUEUE_HISTORY.RECURRING_SYNC,
      removeOnFail: QUEUE_HISTORY.RECURRING_SYNC,
      lockDuration: MAX_QUEUE_RUNTIMES.RECURRING_SYNC,
      prometheusRegistry
    })

    const updateReplicaSetQueue = makeQueue({
      name: QUEUE_NAMES.UPDATE_REPLICA_SET,
      removeOnComplete: QUEUE_HISTORY.UPDATE_REPLICA_SET,
      removeOnFail: QUEUE_HISTORY.UPDATE_REPLICA_SET,
      lockDuration: MAX_QUEUE_RUNTIMES.UPDATE_REPLICA_SET,
      prometheusRegistry
    })

    const recoverOrphanedDataQueue = makeQueue({
      name: QUEUE_NAMES.RECOVER_ORPHANED_DATA,
      removeOnComplete: QUEUE_HISTORY.RECOVER_ORPHANED_DATA,
      removeOnFail: QUEUE_HISTORY.RECOVER_ORPHANED_DATA,
      lockDuration: MAX_QUEUE_RUNTIMES.RECOVER_ORPHANED_DATA,
      prometheusRegistry,
      limiter: {
        // Bull doesn't allow either of these to be set to 0, so we'll pause the queue later if the jobs per interval is 0
        max:
          config.get('recoverOrphanedDataQueueRateLimitJobsPerInterval') || 1,
        duration: config.get('recoverOrphanedDataQueueRateLimitInterval') || 1
      }
    })

    // Clear any old state if redis was running but the rest of the server restarted
    await manualSyncQueue.obliterate({ force: true })
    await recurringSyncQueue.obliterate({ force: true })
    await updateReplicaSetQueue.obliterate({ force: true })
    await recoverOrphanedDataQueue.obliterate({ force: true })

    // Queue the first recoverOrphanedData job, which will re-enqueue itself
    await this.startRecoverOrphanedDataQueue(
      recoverOrphanedDataQueue,
      discoveryNodeEndpoint
    )

    this.registerQueueEventHandlersAndJobProcessors({
      manualSyncQueue,
      recurringSyncQueue,
      updateReplicaSetQueue,
      recoverOrphanedDataQueue,
      processManualSync:
        this.makeProcessManualSyncJob(prometheusRegistry).bind(this),
      processRecurringSync:
        this.makeProcessRecurringSyncJob(prometheusRegistry).bind(this),
      processUpdateReplicaSet:
        this.makeProcessUpdateReplicaSetJob(prometheusRegistry).bind(this),
      recoverOrphanedData:
        this.makeRecoverOrphanedDataJob(prometheusRegistry).bind(this)
    })

    return {
      manualSyncQueue,
      recurringSyncQueue,
      updateReplicaSetQueue,
      recoverOrphanedDataQueue
    }
  }

  /**
   * Registers event handlers for logging and job success/failure.
   * @param {Object} params.queue the queue to register events for
   * @param {Object} params.manualSyncQueue the manual sync queue
   * @param {Object} params.recurringSyncQueue the recurring sync queue
   * @param {Object} params.updateReplicaSetQueue the updateReplicaSetQueue queue
   * @param {Object} params.recoverOrphanedDataQueue the recoverOrphanedDataQueue queue
   * @param {Function<job>} params.processManualSync the function to call when processing a manual sync job from the queue
   * @param {Function<job>} params.processRecurringSync the function to call when processing a recurring sync job from the queue
   * @param {Function<job>} params.processUpdateReplicaSet the function to call when processing an update-replica-set job from the queue
   * @param {Function<job>} params.recoverOrphanedData the function to call when processing a recover-orphaned-data job from the queue
   */
  registerQueueEventHandlersAndJobProcessors({
    manualSyncQueue,
    recurringSyncQueue,
    updateReplicaSetQueue,
    recoverOrphanedDataQueue,
    processManualSync,
    processRecurringSync,
    processUpdateReplicaSet,
    recoverOrphanedData
  }) {
    // Add handlers for logging
    registerQueueEvents(manualSyncQueue, manualSyncLogger)
    registerQueueEvents(recurringSyncQueue, recurringSyncLogger)
    registerQueueEvents(updateReplicaSetQueue, updateReplicaSetLogger)
    registerQueueEvents(recoverOrphanedDataQueue, recoverOrphanedDataLogger)

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
    recoverOrphanedDataQueue.on('failed', (job, err) => {
      const logger = createChildLogger(recoverOrphanedDataLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
      // This is a recurring job that re-enqueues itself on success, so we want to also re-enqueue on failure
      const {
        data: { discoveryNodeEndpoint }
      } = job
      recoverOrphanedDataQueue.add({ discoveryNodeEndpoint })
    })

    // Register the logic that gets executed to process each new job from the queues
    manualSyncQueue.process(
      config.get('maxManualRequestSyncJobConcurrency'),
      processManualSync
    )
    recurringSyncQueue.process(
      config.get('maxRecurringRequestSyncJobConcurrency'),
      processRecurringSync
    )
    updateReplicaSetQueue.process(
      config.get('maxUpdateReplicaSetJobConcurrency'),
      processUpdateReplicaSet
    )
    recoverOrphanedDataQueue.process(1 /** concurrency */, recoverOrphanedData)
  }

  /**
   * Adds a job that will find+reconcile data on nodes outside of a user's replica set.
   * Future jobs are added to the queue as a result of this initial job succeeding or failing to complete.
   * @param {BullQueue} queue the queue that processes jobs to recover orphaned data
   * @param {string} discoveryNodeEndpoint the IP address or URL of a Discovery Node
   */
  async startRecoverOrphanedDataQueue(queue, discoveryNodeEndpoint) {
    // Since we can't pass 0 to Bull's limiter.max, enforce a rate limit of 0 by
    // pausing the queue and not enqueuing the first job
    if (config.get('recoverOrphanedDataQueueRateLimitJobsPerInterval') === 0) {
      await queue.pause()
      return
    }

    // Enqueue first recoverOrphanedData job after a delay. This job requeues itself upon completion or failure
    await queue.add({ discoveryNodeEndpoint })
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

  makeRecoverOrphanedDataJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        job,
        recoverOrphanedDataJobProcessor,
        recoverOrphanedDataLogger,
        prometheusRegistry
      )
  }
}

module.exports = StateReconciliationManager
