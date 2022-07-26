const BullQueue = require('bull')
const _ = require('lodash')

const config = require('../../../config')
const {
  QUEUE_HISTORY,
  QUEUE_NAMES,
  MAX_QUEUE_RUNTIMES,
  STATE_MONITORING_QUEUE_INIT_DELAY_MS
} = require('../stateMachineConstants')
const { makeQueue, registerQueueEvents } = require('../stateMachineUtils')
const processJob = require('../processJob')
const { logger: baseLogger, createChildLogger } = require('../../../logging')
const { getLatestUserIdFromDiscovery } = require('./stateMonitoringUtils')
const monitorStateJobProcessor = require('./monitorState.jobProcessor')
const findSyncRequestsJobProcessor = require('./findSyncRequests.jobProcessor')
const findReplicaSetUpdatesJobProcessor = require('./findReplicaSetUpdates.jobProcessor')
const fetchCNodeEndpointToSpIdMapJobProcessor = require('./fetchCNodeEndpointToSpIdMap.jobProcessor')

const monitorStateLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.MONITOR_STATE
})
const findSyncRequestsLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.FIND_SYNC_REQUESTS
})
const findReplicaSetUpdatesLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.FIND_REPLICA_SET_UPDATES
})
const cNodeEndpointToSpIdMapQueueLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP
})

/**
 * Handles setup and job processing of the queue with jobs for:
 * - fetching a slice of users and gathering their state
 * - finding syncs that should be issued for users to sync their data from their primary to their secondaries
 * - finding users who need a replica set update (when an unhealthy primary or secondary should be replaced)
 */
class StateMonitoringManager {
  async init(discoveryNodeEndpoint, prometheusRegistry) {
    // Create and start queue to fetch cNodeEndpoint->spId mapping
    const cNodeEndpointToSpIdMapQueue = makeQueue({
      name: QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP,
      removeOnComplete: QUEUE_HISTORY.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP,
      removeOnFail: QUEUE_HISTORY.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP,
      lockDuration: MAX_QUEUE_RUNTIMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP,
      limiter: {
        max: 1,
        duration: 10000 // 10s config.get('fetchCNodeEndpointToSpIdMapIntervalMs')
      }
    })
    await this.startEndpointToSpIdMapQueue(
      cNodeEndpointToSpIdMapQueue,
      prometheusRegistry
    )

    // Create queue to slice through batches of users and gather data to be passed to find-sync and find-replica-set-update jobs
    const monitorStateQueue = makeQueue({
      name: QUEUE_NAMES.MONITOR_STATE,
      removeOnComplete: QUEUE_HISTORY.MONITOR_STATE,
      removeOnFail: QUEUE_HISTORY.MONITOR_STATE,
      lockDuration: MAX_QUEUE_RUNTIMES.MONITOR_STATE,
      limiter: {
        // Bull doesn't allow either of these to be set to 0
        max: config.get('stateMonitoringQueueRateLimitJobsPerInterval') || 1,
        duration: config.get('stateMonitoringQueueRateLimitInterval') || 1
      }
    })

    // Create queue to find sync requests
    const findSyncRequestsQueue = makeQueue({
      name: QUEUE_NAMES.FIND_SYNC_REQUESTS,
      removeOnComplete: QUEUE_HISTORY.FIND_SYNC_REQUESTS,
      removeOnFail: QUEUE_HISTORY.FIND_SYNC_REQUESTS,
      lockDuration: MAX_QUEUE_RUNTIMES.FIND_SYNC_REQUESTS
    })

    // Create queue to find replica set updates
    const findReplicaSetUpdatesQueue = makeQueue({
      name: QUEUE_NAMES.FIND_REPLICA_SET_UPDATES,
      removeOnComplete: QUEUE_HISTORY.FIND_REPLICA_SET_UPDATES,
      removeOnFail: QUEUE_HISTORY.FIND_REPLICA_SET_UPDATES,
      lockDuration: MAX_QUEUE_RUNTIMES.FIND_REPLICA_SET_UPDATES
    })

    this.registerMonitoringQueueEventHandlersAndJobProcessors({
      monitorStateQueue,
      findSyncRequestsQueue,
      findReplicaSetUpdatesQueue,
      cNodeEndpointToSpIdMapQueue,
      monitorStateJobFailureCallback: this.enqueueMonitorStateJobAfterFailure,
      processMonitorStateJob:
        this.makeProcessMonitorStateJob(prometheusRegistry).bind(this),
      processFindSyncRequestsJob:
        this.makeProcessFindSyncRequestsJob(prometheusRegistry).bind(this),
      processFindReplicaSetUpdatesJob:
        this.makeProcessFindReplicaSetUpdatesJob(prometheusRegistry).bind(this)
    })

    // Clear any old state if redis was running but the rest of the server restarted
    await monitorStateQueue.obliterate({ force: true })
    await findSyncRequestsQueue.obliterate({ force: true })
    await findReplicaSetUpdatesQueue.obliterate({ force: true })

    // Enqueue first monitor-state job
    await this.startMonitorStateQueue(monitorStateQueue, discoveryNodeEndpoint)

    return {
      monitorStateQueue,
      findSyncRequestsQueue,
      findReplicaSetUpdatesQueue,
      cNodeEndpointToSpIdMapQueue
    }
  }

  /**
   * Registers event handlers for logging and job success/failure.
   * @param {Object} params
   * @param {Object} params.monitoringStateQueue the monitor-state queue to register events for
   * @param {Object} params.findSyncRequestsQueue the find-sync-requests queue to register events for
   * @param {Object} params.findReplicaSetUpdatesQueue the find-replica-set-updates queue to register events for
   * @param {Object} params.cNodeEndpointToSpIdMapQueue the queue that fetches the cNodeEndpoint->spId map
   * @param {Function<failedJob>} params.monitorStateJobFailureCallback the function to call when a monitorState job fails
   * @param {Function<job>} params.processMonitorStateJob the function to call when processing a job from the queue to monitor state
   * @param {Function<job>} params.processFindSyncRequestsJob the function to call when processing a job from the queue to find sync requests that potentially need to be issued
   * @param {Function<job>} params.processFindReplicaSetUpdatesJob the function to call when processing a job from the queue to find users' replica sets that are unhealthy and need to be updated
   */
  registerMonitoringQueueEventHandlersAndJobProcessors({
    monitorStateQueue,
    findSyncRequestsQueue,
    findReplicaSetUpdatesQueue,
    cNodeEndpointToSpIdMapQueue,
    monitorStateJobFailureCallback,
    processMonitorStateJob,
    processFindSyncRequestsJob,
    processFindReplicaSetUpdatesJob
  }) {
    // Add handlers for logging
    registerQueueEvents(monitorStateQueue, monitorStateLogger)
    registerQueueEvents(findSyncRequestsQueue, findSyncRequestsLogger)
    registerQueueEvents(findReplicaSetUpdatesQueue, findReplicaSetUpdatesLogger)
    registerQueueEvents(
      cNodeEndpointToSpIdMapQueue,
      cNodeEndpointToSpIdMapQueueLogger
    )

    // Log when a job fails to complete and re-enqueue another monitoring job
    monitorStateQueue.on('failed', (job, err) => {
      const logger = createChildLogger(monitorStateLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
      monitorStateJobFailureCallback(monitorStateQueue, job)
    })
    findSyncRequestsQueue.on('failed', (job, err) => {
      const logger = createChildLogger(findSyncRequestsLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
    })
    findReplicaSetUpdatesQueue.on('failed', (job, err) => {
      const logger = createChildLogger(findReplicaSetUpdatesLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
    })
    cNodeEndpointToSpIdMapQueue.on('failed', (job, err) => {
      const logger = createChildLogger(cNodeEndpointToSpIdMapQueueLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
    })

    // Register the logic that gets executed to process each new job from the queues
    monitorStateQueue.process(1 /** concurrency */, processMonitorStateJob)
    findSyncRequestsQueue.process(
      1 /** concurrency */,
      processFindSyncRequestsJob
    )
    findReplicaSetUpdatesQueue.process(
      1 /** concurrency */,
      processFindReplicaSetUpdatesJob
    )
  }

  /**
   * Adds handlers for when a job fails to complete (or completes with an error) or successfully completes.
   * Handlers enqueue another job to fetch the cNodeEndpoint->spId map again.
   * @param {BullQueue} queue the cNodeToEndpointSpIdMap queue
   */
  makeCNodeToEndpointSpIdMapReEnqueueItself(queue) {
    queue.on('completed', (job, result) => {
      cNodeEndpointToSpIdMapQueueLogger.info(
        `Queue Job Completed - ID ${job?.id} - Result ${JSON.stringify(result)}`
      )
      queue.add({})
    })
    queue.on('failed', (job, err) => {
      cNodeEndpointToSpIdMapQueueLogger.error(
        `Queue Job Failed - ID ${job?.id} - Error ${err}`
      )
      queue.add({})
    })
  }

  /**
   * Enqueues a job that picks up where the previous failed job left off.
   * @param monitoringQueue the queue to re-add the job to
   * @param failedJob the jobData for the previous job that failed
   */
  enqueueMonitorStateJobAfterFailure(monitoringQueue, failedJob) {
    const {
      data: { lastProcessedUserId, discoveryNodeEndpoint }
    } = failedJob

    monitoringQueue.add({
      lastProcessedUserId,
      discoveryNodeEndpoint
    })
  }

  /**
   * Clears the monitoring queue and adds a job that will start processing users
   * starting from a random userId. Future jobs are added to the queue as a
   * result of this initial job succeeding or failing to complete.
   * @param {Object} queue the StateMonitoringQueue to consume jobs from
   * @param {string} discoveryNodeEndpoint the IP address or URL of a Discovery Node
   */
  async startMonitorStateQueue(queue, discoveryNodeEndpoint) {
    // Since we can't pass 0 to Bull's limiter.max, enforce a rate limit of 0 by
    // pausing the queue and not enqueuing the first job
    if (config.get('stateMonitoringQueueRateLimitJobsPerInterval') === 0) {
      await queue.pause()
      return
    }

    // Start at a random userId to avoid biased processing of early users
    const latestUserId = await getLatestUserIdFromDiscovery(
      discoveryNodeEndpoint
    )
    const lastProcessedUserId = _.random(0, latestUserId)

    // Enqueue first monitorState job after a delay. This job requeues itself upon completion or failure
    await queue.add(
      /** data */
      {
        lastProcessedUserId,
        discoveryNodeEndpoint
      },
      /** opts */ { delay: STATE_MONITORING_QUEUE_INIT_DELAY_MS }
    )
  }

  /**
   * Clears the cNodeEndpoint->spId map queue and adds an initial job.
   * Future jobs are added to the queue as a result of this initial job succeeding/failing.
   * @param {Object} queue the cNodeEndpoint->spId map queue to consume jobs from
   * @param {Object} prometheusRegistry the registry of metrics from src/services/prometheusMonitoring/prometheusRegistry.js
   */
  async startEndpointToSpIdMapQueue(queue, prometheusRegistry) {
    // Clear any old state if redis was running but the rest of the server restarted
    await queue.obliterate({ force: true })

    queue.process(
      1 /** concurrency */,
      this.makeProcessFetchCNodeEndpointToSpIdMapJob(prometheusRegistry).bind(
        this
      )
    )

    // Since we can't pass 0 to Bull's limiter.max, enforce a rate limit of 0 by
    // pausing the queue and not enqueuing the first job
    if (config.get('stateMonitoringQueueRateLimitJobsPerInterval') === 0) {
      await queue.pause()
      return
    }

    // Enqueue first job, which requeues itself upon completion or failure
    await queue.add({})
    this.makeCNodeToEndpointSpIdMapReEnqueueItself(queue)
  }

  /*
   * Job processor boilerplate
   */

  makeProcessMonitorStateJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        job,
        monitorStateJobProcessor,
        monitorStateLogger,
        prometheusRegistry
      )
  }

  makeProcessFindSyncRequestsJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        job,
        findSyncRequestsJobProcessor,
        findSyncRequestsLogger,
        prometheusRegistry
      )
  }

  makeProcessFindReplicaSetUpdatesJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        job,
        findReplicaSetUpdatesJobProcessor,
        findReplicaSetUpdatesLogger,
        prometheusRegistry
      )
  }

  makeProcessFetchCNodeEndpointToSpIdMapJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        job,
        fetchCNodeEndpointToSpIdMapJobProcessor,
        cNodeEndpointToSpIdMapQueueLogger,
        prometheusRegistry
      )
  }
}

module.exports = StateMonitoringManager
