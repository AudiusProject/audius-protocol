const BullQueue = require('bull')
const _ = require('lodash')

const config = require('../../../config')
const {
  QUEUE_HISTORY,
  QUEUE_NAMES,
  JOB_NAMES,
  STATE_MONITORING_QUEUE_MAX_JOB_RUNTIME_MS,
  C_NODE_ENDPOINT_TO_SP_ID_MAP_QUEUE_MAX_JOB_RUNTIME_MS,
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

const monitoringQueueLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.STATE_MONITORING
})
const cNodeEndpointToSpIdMapQueueLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.C_NODE_ENDPOINT_TO_SP_ID_MAP
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
      redisHost: config.get('redisHost'),
      redisPort: config.get('redisPort'),
      name: QUEUE_NAMES.C_NODE_ENDPOINT_TO_SP_ID_MAP,
      removeOnComplete: QUEUE_HISTORY.C_NODE_ENDPOINT_TO_SP_ID_MAP,
      removeOnFail: QUEUE_HISTORY.C_NODE_ENDPOINT_TO_SP_ID_MAP,
      lockDuration: C_NODE_ENDPOINT_TO_SP_ID_MAP_QUEUE_MAX_JOB_RUNTIME_MS,
      limiter: {
        max: 1,
        duration: config.get('fetchCNodeEndpointToSpIdMapIntervalMs')
      }
    })
    await this.startEndpointToSpIdMapQueue(
      cNodeEndpointToSpIdMapQueue,
      prometheusRegistry
    )

    // Create and start queue to monitor state for syncs and reconfigs
    const stateMonitoringQueue = makeQueue({
      redisHost: config.get('redisHost'),
      redisPort: config.get('redisPort'),
      name: QUEUE_NAMES.STATE_MONITORING,
      removeOnComplete: QUEUE_HISTORY.STATE_MONITORING,
      removeOnFail: QUEUE_HISTORY.STATE_MONITORING,
      lockDuration: STATE_MONITORING_QUEUE_MAX_JOB_RUNTIME_MS,
      limiter: {
        // Bull doesn't allow either of these to be set to 0
        max: config.get('stateMonitoringQueueRateLimitJobsPerInterval') || 1,
        duration: config.get('stateMonitoringQueueRateLimitInterval') || 1
      }
    })
    this.registerMonitoringQueueEventHandlersAndJobProcessors({
      monitoringQueue: stateMonitoringQueue,
      cNodeEndpointToSpIdMapQueue,
      monitorStateJobFailureCallback: this.enqueueMonitorStateJobAfterFailure,
      processMonitorStateJob:
        this.makeProcessMonitorStateJob(prometheusRegistry).bind(this),
      processFindSyncRequestsJob:
        this.makeProcessFindSyncRequestsJob(prometheusRegistry).bind(this),
      processFindReplicaSetUpdatesJob:
        this.makeProcessFindReplicaSetUpdatesJob(prometheusRegistry).bind(this)
    })
    await this.startMonitoringQueue(stateMonitoringQueue, discoveryNodeEndpoint)

    return {
      stateMonitoringQueue,
      cNodeEndpointToSpIdMapQueue
    }
  }

  /**
   * Registers event handlers for logging and job success/failure.
   * @param {Object} params
   * @param {Object} params.monitoringQueue the monitoring queue to register events for
   * @param {Object} params.cNodeEndpointToSpIdMapQueue the queue that fetches the cNodeEndpoint->spId map
   * @param {Function<failedJob>} params.monitorStateJobFailureCallback the function to call when a monitorState job fails
   * @param {Function<job>} params.processMonitorStateJob the function to call when processing a job from the queue to monitor state
   * @param {Function<job>} params.processFindSyncRequestsJob the function to call when processing a job from the queue to find sync requests that potentially need to be issued
   * @param {Function<job>} params.processFindReplicaSetUpdatesJob the function to call when processing a job from the queue to find users' replica sets that are unhealthy and need to be updated
   */
  registerMonitoringQueueEventHandlersAndJobProcessors({
    monitoringQueue,
    cNodeEndpointToSpIdMapQueue,
    monitorStateJobFailureCallback,
    processMonitorStateJob,
    processFindSyncRequestsJob,
    processFindReplicaSetUpdatesJob
  }) {
    // Add handlers for logging
    registerQueueEvents(monitoringQueue, monitoringQueueLogger)
    registerQueueEvents(
      cNodeEndpointToSpIdMapQueue,
      cNodeEndpointToSpIdMapQueueLogger
    )

    // Log when a job fails to complete and re-enqueue another monitoring job
    monitoringQueue.on('failed', (job, err) => {
      const logger = createChildLogger(monitoringQueueLogger, {
        jobId: job?.id || 'unknown'
      })
      logger.error(`Job failed to complete. ID=${job?.id}. Error=${err}`)
      if (job?.name === JOB_NAMES.MONITOR_STATE) {
        monitorStateJobFailureCallback(monitoringQueue, job)
      }
    })

    // Register the logic that gets executed to process each new job from the queue
    monitoringQueue.process(
      JOB_NAMES.MONITOR_STATE,
      1 /** concurrency */,
      processMonitorStateJob
    )
    monitoringQueue.process(
      JOB_NAMES.FIND_SYNC_REQUESTS,
      1 /** concurrency */,
      processFindSyncRequestsJob
    )
    monitoringQueue.process(
      JOB_NAMES.FIND_REPLICA_SET_UPDATES,
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
      queue.add(JOB_NAMES.C_NODE_ENDPOINT_TO_SP_ID_MAP, /** data */ {})
    })
    queue.on('failed', (job, err) => {
      cNodeEndpointToSpIdMapQueueLogger.error(
        `Queue Job Failed - ID ${job?.id} - Error ${err}`
      )
      queue.add(JOB_NAMES.C_NODE_ENDPOINT_TO_SP_ID_MAP, /** data */ {})
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

    monitoringQueue.add(JOB_NAMES.MONITOR_STATE, {
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
  async startMonitoringQueue(queue, discoveryNodeEndpoint) {
    // Clear any old state if redis was running but the rest of the server restarted
    await queue.obliterate({ force: true })

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
      JOB_NAMES.MONITOR_STATE,
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
      JOB_NAMES.C_NODE_ENDPOINT_TO_SP_ID_MAP,
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
    await queue.add(JOB_NAMES.C_NODE_ENDPOINT_TO_SP_ID_MAP, /** data */ {})
    this.makeCNodeToEndpointSpIdMapReEnqueueItself(queue)
  }

  /*
   * Job processor boilerplate
   */

  makeProcessMonitorStateJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        JOB_NAMES.MONITOR_STATE,
        job,
        monitorStateJobProcessor,
        monitoringQueueLogger,
        prometheusRegistry
      )
  }

  makeProcessFindSyncRequestsJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        JOB_NAMES.FIND_SYNC_REQUESTS,
        job,
        findSyncRequestsJobProcessor,
        monitoringQueueLogger,
        prometheusRegistry
      )
  }

  makeProcessFindReplicaSetUpdatesJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        JOB_NAMES.FIND_REPLICA_SET_UPDATES,
        job,
        findReplicaSetUpdatesJobProcessor,
        monitoringQueueLogger,
        prometheusRegistry
      )
  }

  makeProcessFetchCNodeEndpointToSpIdMapJob(prometheusRegistry) {
    return async (job) =>
      processJob(
        JOB_NAMES.C_NODE_ENDPOINT_TO_SP_ID_MAP,
        job,
        fetchCNodeEndpointToSpIdMapJobProcessor,
        cNodeEndpointToSpIdMapQueueLogger,
        prometheusRegistry
      )
  }
}

module.exports = StateMonitoringManager
