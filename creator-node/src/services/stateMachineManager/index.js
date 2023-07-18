const _ = require('lodash')
const { QueueEvents } = require('bullmq')

const config = require('../../config')
const { logger: baseLogger } = require('../../logging')
const redis = require('../../redis')

const StateMonitoringManager = require('./stateMonitoring')
const StateReconciliationManager = require('./stateReconciliation')
const {
  QUEUE_NAMES,
  FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_CONSTS
} = require('./stateMachineConstants')
const makeOnCompleteCallback = require('./makeOnCompleteCallback')
const { updateContentNodeChainInfo } = require('../ContentNodeInfoManager')
const { clearSyncStatuses } = require('../sync/syncUtil')

/**
 * Manages the queue for monitoring the state of Content Nodes and
 * the queue for reconciling anomalies in the state (syncs and replica set updates).
 */
class StateMachineManager {
  async init(audiusLibs, prometheusRegistry) {
    await this.ensureCleanFilterOutAlreadyPresentDBEntriesRedisState()
    await clearSyncStatuses()

    // Cache Content Node info immediately since it'll be needed before the first Bull job runs to fetch it
    await updateContentNodeChainInfo(baseLogger, redis, audiusLibs.ethContracts)

    // Initialize queues
    const stateMonitoringManager = new StateMonitoringManager()
    const stateReconciliationManager = new StateReconciliationManager()
    const { cNodeEndpointToSpIdMapQueue } = await stateMonitoringManager.init(
      prometheusRegistry
    )
    const { manualSyncQueue } = await stateReconciliationManager.init(
      prometheusRegistry
    )

    // Upon completion, make queue jobs record metrics and enqueue other jobs as necessary
    const queueNameToQueueMap = {
      [QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP]: {
        queue: cNodeEndpointToSpIdMapQueue,
        maxWaitingJobs: 10
      },
      [QUEUE_NAMES.MANUAL_SYNC]: {
        queue: manualSyncQueue,
        maxWaitingJobs: 1000
      }
    }
    for (const queueName of Object.keys(queueNameToQueueMap)) {
      const queueEvents = new QueueEvents(queueName, {
        connection: {
          host: config.get('redisHost'),
          port: config.get('redisPort')
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      queueEvents.on('completed', async ({ jobId, returnvalue }, id) => {
        try {
          await makeOnCompleteCallback(
            queueName,
            queueNameToQueueMap,
            prometheusRegistry
          ).bind(this)({ jobId, returnvalue }, id)
        } catch (e) {
          baseLogger.error(
            'Fatal: onComplete errored. Cron queues may be broken.'
          )
        }
      })

      // Update the mapping in this StateMachineManager whenever a job successfully fetches it
      if (queueName === QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP) {
        queueEvents.on('failed', (_args, _id) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          cNodeEndpointToSpIdMapQueue.add('retry-after-fail', {})
        })
        queueEvents.on('error', (_args) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          cNodeEndpointToSpIdMapQueue.add('retry-after-error', {})
        })
      }
    }

    // Start queues that need an initial job to get started and then re-add jobs to themselves
    await stateMonitoringManager.startEndpointToSpIdMapQueue(
      cNodeEndpointToSpIdMapQueue
    )

    return {
      cNodeEndpointToSpIdMapQueue,
      manualSyncQueue,
      stateMonitoringManager,
      stateReconciliationManager
    }
  }

  /**
   * Ensure clean redis state for primarySyncFromSecondary():filterOutAlreadyPresentDBEntries() at server restart
   *
   * Throws on internal error
   */
  async ensureCleanFilterOutAlreadyPresentDBEntriesRedisState() {
    const keyPattern =
      FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_CONSTS.FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_PREFIX +
      '*'
    const numDeleted = await redis.deleteAllKeysMatchingPattern(keyPattern)
    baseLogger.info(
      { numDeleted },
      `ensureCleanFilterOutAlreadyPresentDBEntriesRedisState: Deleted all redis keys matching pattern ${keyPattern}`
    )
  }
}

module.exports = StateMachineManager
