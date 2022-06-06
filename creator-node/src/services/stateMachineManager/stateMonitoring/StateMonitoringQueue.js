const BullQueue = require('bull')
const _ = require('lodash')

const config = require('../../../config')
const {
  QUEUE_HISTORY,
  QUEUE_NAMES,
  JOB_NAMES,
  STATE_MONITORING_QUEUE_MAX_JOB_RUNTIME_MS,
  STATE_MONITORING_QUEUE_INIT_DELAY_MS
} = require('../stateMachineConstants')
const { processJob } = require('../stateMachineUtils')
const QueueInterfacer = require('../QueueInterfacer')
const { logger: baseLogger, createChildLogger } = require('../../../logging')
const { getLatestUserIdFromDiscovery } = require('./stateMonitoringUtils')
const monitorStateJobProcessor = require('./monitorState.jobProcessor')
const findPotentialSyncsJobProcessor = require('./findPotentialSyncs.jobProcessor')
const findReplicaSetUpdatesJobProcessor = require('./findReplicaSetUpdates.jobProcessor')

const logger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.STATE_MONITORING
})

/**
 * Handles setup and lifecycle management (adding and processing jobs)
 * of the queue that calculates required syncs and replica set updates (handles user slicing, clocks,
 * gathering sync metrics, and computing healthy/unhealthy peers).
 */
class StateMonitoringQueue {
  async init({
    discoveryNodeEndpoint,
    monitorStateJobSuccessCallback,
    findPotentialSyncsJobSuccessCallback,
    findReplicaSetUpdatesJobSuccessCallback
  }) {
    const queue = this.makeQueue(
      config.get('redisHost'),
      config.get('redisPort')
    )
    this.registerQueueEventHandlersAndJobProcessors({
      queue,
      monitorStateJobSuccessCallback: (job, result) => {
        monitorStateJobSuccessCallback(result)
        this.enqueueMonitorStateJobAfterSuccess(job, result)
      },
      findPotentialSyncsJobSuccessCallback,
      findReplicaSetUpdatesJobSuccessCallback,
      monitorStateJobFailureCallback: this.enqueueMonitorStateJobAfterFailure,
      processMonitorStateJob: this.processMonitorStateJob.bind(this),
      processFindPotentialSyncsJob:
        this.processFindPotentialSyncsJob.bind(this),
      processFindReplicaSetUpdatesJob:
        this.processFindReplicaSetUpdatesJob.bind(this)
    })

    await this.startQueue(queue, discoveryNodeEndpoint)
    return queue
  }

  makeQueue(redisHost, redisPort) {
    // Settings config from https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#advanced-settings
    return new BullQueue(QUEUE_NAMES.STATE_MONITORING, {
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
        lockDuration: STATE_MONITORING_QUEUE_MAX_JOB_RUNTIME_MS,
        // We never want to re-process stalled jobs
        maxStalledCount: 0
      },
      limiter: {
        // Bull doesn't allow either of these to be set to 0
        max: config.get('stateMonitoringQueueRateLimitJobsPerInterval') || 1,
        duration: config.get('stateMonitoringQueueRateLimitInterval') || 1
      }
    })
  }

  /**
   * Registers event handlers for logging and job success/failure.
   * @param {Object} params.queue the queue to register events for
   * @param {Function<successfulJob, jobResult>} params.monitorStateJobSuccessCallback the function to call when a monitorState job succeeds
   * @param {Function<failedJob>} params.monitorStateJobFailureCallback the function to call when a monitorState job fails
   * @param {Function<jobResult>} findPotentialSyncsJobSuccessCallback the function to call when a findPotentialSyncs job succeeds
   * @param {Function<jobResult>} findReplicaSetUpdatesJobSuccessCallback the function to call when a findReplicaSetUpdates job succeeds
   * @param {Function<job>} params.processMonitorStateJob the function to call when processing a job from the queue to monitor state
   * @param {Function<job>} params.processFindPotentialSyncsJob the function to call when processing a job from the queue to find sync requests that potentially need to be issued
   * @param {Function<job>} params.processFindReplicaSetUpdatesJob the function to call when processing a job from the queue to find users' replica sets that are unhealthy and need to be updated
   */
  registerQueueEventHandlersAndJobProcessors({
    queue,
    monitorStateJobSuccessCallback,
    monitorStateJobFailureCallback,
    findPotentialSyncsJobSuccessCallback,
    findReplicaSetUpdatesJobSuccessCallback,
    processMonitorStateJob,
    processFindPotentialSyncsJob,
    processFindReplicaSetUpdatesJob
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
      logger.error(`Queue Job Stalled - ID ${jobId}`)
    })
    queue.on('global:error', (error) => {
      logger.error(`Queue Job Error - ${error}`)
    })

    // Add handlers for when a job fails to complete (or completes with an error) or successfully completes
    queue.on('completed', (job, result) => {
      logger.info(
        `Queue Job Completed - ID ${job?.id} - Result ${JSON.stringify(result)}`
      )
      switch (job?.name) {
        case JOB_NAMES.MONITOR_STATE:
          if (result?.jobSucceeded) {
            monitorStateJobSuccessCallback(job, result)
          } else {
            monitorStateJobFailureCallback(job)
          }
          break
        case JOB_NAMES.FIND_POTENTIAL_SYNCS:
          findPotentialSyncsJobSuccessCallback(result)
          break
        case JOB_NAMES.FIND_REPLICA_SET_UPDATES:
          findReplicaSetUpdatesJobSuccessCallback(result)
          break
      }
    })
    queue.on('failed', (job, err) => {
      logger.error(`Queue Job Failed - ID ${job?.id} - Error ${err}`)
      if (job?.name === JOB_NAMES.MONITOR_STATE) {
        monitorStateJobFailureCallback(job)
      }
    })

    // Register the logic that gets executed to process each new job from the queue
    queue.process(
      JOB_NAMES.MONITOR_STATE,
      1 /** concurrency */,
      processMonitorStateJob
    )
    queue.process(
      JOB_NAMES.FIND_POTENTIAL_SYNCS,
      1 /** concurrency */,
      processFindPotentialSyncsJob
    )
    queue.process(
      JOB_NAMES.FIND_REPLICA_SET_UPDATES,
      1 /** concurrency */,
      processFindReplicaSetUpdatesJob
    )
  }

  /**
   * Enqueues a job that processes the next slice of users after the slice
   * that the previous job sucessfully processed.
   * @param successfulJob the jobData of the previous job that succeeded
   * @param successfulJobResult the result of the previous job that succeeded
   */
  enqueueMonitorStateJobAfterSuccess(successfulJob, successfulJobResult) {
    const {
      data: { discoveryNodeEndpoint }
    } = successfulJob
    const { lastProcessedUserId } = successfulJobResult

    QueueInterfacer.addStateMonitoringJob(JOB_NAMES.MONITOR_STATE, {
      lastProcessedUserId,
      discoveryNodeEndpoint
    })
  }

  /**
   * Enqueues a job that picks up where the previous failed job left off.
   * @param failedJob the jobData for the previous job that failed
   */
  enqueueMonitorStateJobAfterFailure(failedJob) {
    const {
      data: { lastProcessedUserId, discoveryNodeEndpoint }
    } = failedJob

    QueueInterfacer.addStateMonitoringJob(JOB_NAMES.MONITOR_STATE, {
      lastProcessedUserId,
      discoveryNodeEndpoint
    })
  }

  /**
   * Clears the queue and adds a job that will start processing users
   * starting from a random userId. Future jobs are added to the queue as a
   * result of this initial job succeeding or failing to complete.
   * @param {Object} queue the StateMonitoringQueue to consume jobs from
   * @param {string} discoveryNodeEndpoint the IP address or URL of a Discovery Node
   */
  async startQueue(queue, discoveryNodeEndpoint) {
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

  /*
   * Job processor boilerplate
   */

  async processMonitorStateJob(job) {
    return processJob(
      JOB_NAMES.MONITOR_STATE,
      job,
      monitorStateJobProcessor,
      logger,
      {
        lastProcessedUserId: job.data.lastProcessedUserId,
        jobSucceeded: false
      }
    )
  }

  async processFindPotentialSyncsJob(job) {
    return processJob(
      JOB_NAMES.FIND_POTENTIAL_SYNCS,
      job,
      findPotentialSyncsJobProcessor,
      logger
    )
  }

  async processFindReplicaSetUpdatesJob(job) {
    return processJob(
      JOB_NAMES.FIND_REPLICA_SET_UPDATES,
      job,
      findReplicaSetUpdatesJobProcessor,
      logger
    )
  }
}

module.exports = StateMonitoringQueue
