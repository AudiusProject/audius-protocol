import type { PrometheusRegistry } from '../../prometheusMonitoring/prometheusRegistry'
import type { Queue, Job } from 'bullmq'
import type Logger from 'bunyan'

import _ from 'lodash'
import {
  QUEUE_HISTORY,
  QUEUE_NAMES,
  STATE_MONITORING_QUEUE_INIT_DELAY_MS
} from '../stateMachineConstants'
import { makeQueue } from '../stateMachineUtils'
import { processJob } from '../processJob'
import { logger as baseLogger, createChildLogger } from '../../../logging'
import { clusterUtils } from '../../../utils'
import { getLatestUserIdFromDiscovery } from './stateMonitoringUtils'
import { monitorStateJobProcessor } from './monitorState.jobProcessor'
import { findSyncRequestsJobProcessor } from './findSyncRequests.jobProcessor'
import { findReplicaSetUpdatesJobProcessor } from './findReplicaSetUpdates.jobProcessor'
import { fetchCNodeEndpointToSpIdMapJobProcessor } from './fetchCNodeEndpointToSpIdMap.jobProcessor'
import { AnyJobParams } from '../types'

const config = require('../../../config')

const monitorStateLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.MONITOR_STATE
}) as Logger
const findSyncRequestsLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.FIND_SYNC_REQUESTS
}) as Logger
const findReplicaSetUpdatesLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.FIND_REPLICA_SET_UPDATES
}) as Logger
const cNodeEndpointToSpIdMapQueueLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP
}) as Logger

/**
 * Handles setup and job processing of the queue with jobs for:
 * - fetching a slice of users and gathering their state
 * - finding syncs that should be issued for users to sync their data from their primary to their secondaries
 * - finding users who need a replica set update (when an unhealthy primary or secondary should be replaced)
 */
export class StateMonitoringManager {
  async init(prometheusRegistry: typeof PrometheusRegistry) {
    // Create queue to fetch cNodeEndpoint->spId mapping
    const { queue: cNodeEndpointToSpIdMapQueue } = makeQueue({
      name: QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP,
      processor: this.makeProcessJob(
        fetchCNodeEndpointToSpIdMapJobProcessor,
        cNodeEndpointToSpIdMapQueueLogger,
        prometheusRegistry
      ).bind(this),
      logger: cNodeEndpointToSpIdMapQueueLogger,
      removeOnComplete: QUEUE_HISTORY.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP,
      removeOnFail: QUEUE_HISTORY.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP,
      prometheusRegistry,
      limiter: {
        max: 1,
        duration: config.get('fetchCNodeEndpointToSpIdMapIntervalMs')
      },
      onFailCallback: (job: Job, error: any, _prev: any) => {
        cNodeEndpointToSpIdMapQueueLogger.error(
          `Queue Job Failed - ID ${job?.id} - Error ${error}`
        )
        cNodeEndpointToSpIdMapQueue.add('retry-after-fail', {})
      }
    })

    // Create queue to slice through batches of users and gather data to be passed to find-sync and find-replica-set-update jobs
    const { queue: monitorStateQueue } = makeQueue({
      name: QUEUE_NAMES.MONITOR_STATE,
      processor: this.makeProcessJob(
        monitorStateJobProcessor,
        monitorStateLogger,
        prometheusRegistry
      ).bind(this),
      logger: monitorStateLogger,
      removeOnComplete: QUEUE_HISTORY.MONITOR_STATE,
      removeOnFail: QUEUE_HISTORY.MONITOR_STATE,
      prometheusRegistry,
      limiter: {
        // Bull doesn't allow either of these to be set to 0, so we'll pause the queue later if the jobs per interval is 0
        max: config.get('stateMonitoringQueueRateLimitJobsPerInterval') || 1,
        duration: config.get('stateMonitoringQueueRateLimitInterval') || 1
      },
      onFailCallback: (job: Job, error: any, _prev: any) => {
        const logger = createChildLogger(monitorStateLogger, {
          jobId: job?.id || 'unknown'
        }) as Logger
        logger.error(`Job failed to complete. ID=${job?.id}. Error=${error}`)
        this.enqueueMonitorStateJobAfterFailure(monitorStateQueue, job)
      }
    })

    // Create queue to find sync requests
    const { queue: findSyncRequestsQueue } = makeQueue({
      name: QUEUE_NAMES.FIND_SYNC_REQUESTS,
      processor: this.makeProcessJob(
        findSyncRequestsJobProcessor,
        findSyncRequestsLogger,
        prometheusRegistry
      ).bind(this),
      logger: findSyncRequestsLogger,
      removeOnComplete: QUEUE_HISTORY.FIND_SYNC_REQUESTS,
      removeOnFail: QUEUE_HISTORY.FIND_SYNC_REQUESTS,
      prometheusRegistry
    })

    // Create queue to find replica set updates
    const { queue: findReplicaSetUpdatesQueue } = makeQueue({
      name: QUEUE_NAMES.FIND_REPLICA_SET_UPDATES,
      processor: this.makeProcessJob(
        findReplicaSetUpdatesJobProcessor,
        findReplicaSetUpdatesLogger,
        prometheusRegistry
      ).bind(this),
      logger: findReplicaSetUpdatesLogger,
      removeOnComplete: QUEUE_HISTORY.FIND_REPLICA_SET_UPDATES,
      removeOnFail: QUEUE_HISTORY.FIND_REPLICA_SET_UPDATES,
      prometheusRegistry
    })

    // Clear any old state if redis was running but the rest of the server restarted
    if (clusterUtils.isThisWorkerInit()) {
      await cNodeEndpointToSpIdMapQueue.obliterate({ force: true })
      await monitorStateQueue.obliterate({ force: true })
      await findSyncRequestsQueue.obliterate({ force: true })
      await findReplicaSetUpdatesQueue.obliterate({ force: true })
    }

    return {
      monitorStateQueue,
      findSyncRequestsQueue,
      findReplicaSetUpdatesQueue,
      cNodeEndpointToSpIdMapQueue
    }
  }

  /**
   * Enqueues a job that picks up where the previous failed job left off.
   * @param monitoringQueue the queue to re-add the job to
   * @param failedJob the jobData for the previous job that failed
   */
  enqueueMonitorStateJobAfterFailure(monitoringQueue: Queue, failedJob: Job) {
    const {
      data: { lastProcessedUserId, discoveryNodeEndpoint }
    } = failedJob

    monitoringQueue.add('retry-after-fail', {
      lastProcessedUserId,
      discoveryNodeEndpoint
    })
  }

  /**
   * Adds a job that will start processing users
   * starting from a random userId. Future jobs are added to the queue as a
   * result of this initial job succeeding or failing to complete.
   * @param {Object} queue the StateMonitoringQueue to consume jobs from
   * @param {string} discoveryNodeEndpoint the IP address or URL of a Discovery Node
   */
  async startMonitorStateQueue(queue: Queue, discoveryNodeEndpoint: string) {
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
    if (clusterUtils.isThisWorkerInit()) {
      await queue.add(
        'first-job',
        {
          lastProcessedUserId,
          discoveryNodeEndpoint
        },
        { delay: STATE_MONITORING_QUEUE_INIT_DELAY_MS }
      )
    }
  }

  /**
   * Adds an initial job to the cNodeEndpoint->spId map queue.
   * Future jobs are added to the queue as a result of this initial job succeeding/failing.
   * @param {Object} queue the cNodeEndpoint->spId map queue to consume jobs from
   * @param {Object} prometheusRegistry the registry of metrics from src/services/prometheusMonitoring/prometheusRegistry.js
   */
  async startEndpointToSpIdMapQueue(queue: Queue) {
    // Since we can't pass 0 to Bull's limiter.max, enforce a rate limit of 0 by
    // pausing the queue and not enqueuing the first job
    if (config.get('stateMonitoringQueueRateLimitJobsPerInterval') === 0) {
      await queue.pause()
      return
    }

    // Enqueue first job, which requeues itself upon completion or failure
    if (clusterUtils.isThisWorkerInit()) {
      await queue.add('first-job', {})
    }
  }

  makeProcessJob(
    processor: any,
    logger: Logger,
    prometheusRegistry: typeof PrometheusRegistry
  ) {
    return async (job: { id: string; data: AnyJobParams }) =>
      processJob(job, processor, logger, prometheusRegistry)
  }
}
