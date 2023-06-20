const _ = require('lodash')
const { QueueEvents } = require('bullmq')

const config = require('../../config')
const { logger: baseLogger } = require('../../logging')
const redis = require('../../redis')

const StateMonitoringManager = require('./stateMonitoring')
const StateReconciliationManager = require('./stateReconciliation')
const {
  RECONFIG_MODES,
  QUEUE_NAMES,
  FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_CONSTS
} = require('./stateMachineConstants')
const makeOnCompleteCallback = require('./makeOnCompleteCallback')
const { updateContentNodeChainInfo } = require('../ContentNodeInfoManager')
const SyncRequestDeDuplicator = require('./stateReconciliation/SyncRequestDeDuplicator')
const { clearSyncStatuses } = require('../sync/syncUtil')

/**
 * Manages the queue for monitoring the state of Content Nodes and
 * the queue for reconciling anomalies in the state (syncs and replica set updates).
 */
class StateMachineManager {
  async init(audiusLibs, prometheusRegistry) {
    this.updateEnabledReconfigModesSet()

    await this.ensureCleanFilterOutAlreadyPresentDBEntriesRedisState()
    await clearSyncStatuses()

    // Cache Content Node info immediately since it'll be needed before the first Bull job runs to fetch it
    await updateContentNodeChainInfo(baseLogger, redis, audiusLibs.ethContracts)

    // Initialize queues
    const stateMonitoringManager = new StateMonitoringManager()
    const stateReconciliationManager = new StateReconciliationManager()
    const {
      monitorStateQueue,
      findSyncRequestsQueue,
      findReplicaSetUpdatesQueue,
      cNodeEndpointToSpIdMapQueue
    } = await stateMonitoringManager.init(prometheusRegistry)
    const {
      manualSyncQueue,
      recurringSyncQueue,
      updateReplicaSetQueue,
      recoverOrphanedDataQueue
    } = await stateReconciliationManager.init(prometheusRegistry)

    // Upon completion, make queue jobs record metrics and enqueue other jobs as necessary
    const queueNameToQueueMap = {
      [QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP]: {
        queue: cNodeEndpointToSpIdMapQueue,
        maxWaitingJobs: 10
      },
      [QUEUE_NAMES.MONITOR_STATE]: {
        queue: monitorStateQueue,
        maxWaitingJobs: 10
      },
      [QUEUE_NAMES.FIND_SYNC_REQUESTS]: {
        queue: findSyncRequestsQueue,
        maxWaitingJobs: 10
      },
      [QUEUE_NAMES.FIND_REPLICA_SET_UPDATES]: {
        queue: findReplicaSetUpdatesQueue,
        maxWaitingJobs: 10
      },
      [QUEUE_NAMES.MANUAL_SYNC]: {
        queue: manualSyncQueue,
        maxWaitingJobs: 1000
      },
      [QUEUE_NAMES.RECURRING_SYNC]: {
        queue: recurringSyncQueue,
        maxWaitingJobs: 10000
      },
      [QUEUE_NAMES.UPDATE_REPLICA_SET]: {
        queue: updateReplicaSetQueue,
        maxWaitingJobs: 1000
      },
      [QUEUE_NAMES.RECOVER_ORPHANED_DATA]: {
        queue: recoverOrphanedDataQueue,
        maxWaitingJobs: 10
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
        queueEvents.on(
          'completed',
          this.updateMapOnMapFetchJobComplete.bind(this)
        )
        queueEvents.on('failed', (_args, _id) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          cNodeEndpointToSpIdMapQueue.add('retry-after-fail', {})
        })
        queueEvents.on('error', (_args) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          cNodeEndpointToSpIdMapQueue.add('retry-after-error', {})
        })
      }

      // Recurring queues need to re-enqueue jobs when they fail/error
      else if (queueName === QUEUE_NAMES.MONITOR_STATE) {
        queueEvents.on('failed', (_args, _id) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          stateMonitoringManager.recoverFromJobFailure(
            monitorStateQueue,
            audiusLibs.discoveryProvider.discoveryProviderEndpoint
          )
        })
        queueEvents.on('error', (_args) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          stateMonitoringManager.recoverFromJobFailure(
            monitorStateQueue,
            audiusLibs.discoveryProvider.discoveryProviderEndpoint
          )
        })
      } else if (queueName === QUEUE_NAMES.RECOVER_ORPHANED_DATA) {
        queueEvents.on('failed', (_args, _id) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          recoverOrphanedDataQueue.add('retry-after-fail', {
            discoveryNodeEndpoint:
              audiusLibs.discoveryProvider.discoveryProviderEndpoint
          })
        })
        queueEvents.on('error', (_args) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          recoverOrphanedDataQueue.add('retry-after-error', {
            discoveryNodeEndpoint:
              audiusLibs.discoveryProvider.discoveryProviderEndpoint
          })
        })
      }
    }

    await SyncRequestDeDuplicator.clear()

    // Start queues that need an initial job to get started and then re-add jobs to themselves
    await stateMonitoringManager.startEndpointToSpIdMapQueue(
      cNodeEndpointToSpIdMapQueue
    )
    await stateMonitoringManager.startMonitorStateQueue(
      monitorStateQueue,
      audiusLibs.discoveryProvider.discoveryProviderEndpoint
    )
    await stateReconciliationManager.startRecoverOrphanedDataQueue(
      recoverOrphanedDataQueue,
      audiusLibs.discoveryProvider.discoveryProviderEndpoint
    )

    return {
      monitorStateQueue,
      findSyncRequestsQueue,
      findReplicaSetUpdatesQueue,
      cNodeEndpointToSpIdMapQueue,
      manualSyncQueue,
      recurringSyncQueue,
      updateReplicaSetQueue,
      recoverOrphanedDataQueue,
      stateMonitoringManager,
      stateReconciliationManager
    }
  }

  /**
   * Deserializes the results of a job and updates the enabled reconfig modes to be either:
   * - enabled (to the highest enabled mode configured) if the job fetched the mapping successfully
   * - disabled if the job encountered an error fetching the mapping
   * @param {number} jobId the ID of the job that completed
   * @param {string} returnvalue the stringified JSON of the job's returnValue
   */
  updateMapOnMapFetchJobComplete({ jobId, returnvalue }, _id) {
    // Bull serializes the job result into redis, so we have to deserialize it into JSON
    let jobResult = {}
    try {
      if (typeof returnvalue === 'string' || returnvalue instanceof String) {
        jobResult = JSON.parse(returnvalue) || {}
      } else {
        jobResult = returnvalue || {}
      }
    } catch (e) {
      baseLogger.warn(
        `Failed to parse cNodeEndpoint->spId map jobId ${jobId} result string: ${returnvalue}`
      )
      return
    }

    const { errorMsg } = jobResult
    if (errorMsg?.length) {
      // Disable reconfigs if there was an error fetching the mapping
      this.updateEnabledReconfigModesSet(
        /* override */ RECONFIG_MODES.RECONFIG_DISABLED.key
      )
    } else {
      // Update the reconfig mode to the highest enabled mode if there was no error
      this.updateEnabledReconfigModesSet()
    }
  }

  /**
   * Updates `enabledReconfigModesSet` and `highestEnabledReconfigMode`.
   * Uses `override` if provided, else uses config var.
   * `enabledReconfigModesSet` contains every mode with rank <= `highestEnabledReconfigMode`
   *   - e.g. `highestEnabledReconfigMode = 'PRIMARY_AND_SECONDARY'
   *      `enabledReconfigModesSet = { 'RECONFIG_DISABLED', 'ONE_SECONDARY', 'MULTIPLE_SECONDARIES', 'PRIMARY_AND_SECONDARY' }
   */
  updateEnabledReconfigModesSet(override) {
    let highestEnabledReconfigMode

    const reconfigModeKeys = Object.keys(RECONFIG_MODES)

    // Set mode to override if provided
    if (override) {
      highestEnabledReconfigMode = override

      // Else, set mode to config var, defaulting to RECONFIG_DISABLED if invalid
    } else {
      highestEnabledReconfigMode = reconfigModeKeys.includes(
        config.get('snapbackHighestReconfigMode')
      )
        ? config.get('snapbackHighestReconfigMode')
        : RECONFIG_MODES.RECONFIG_DISABLED.key
    }

    // All modes with lower rank than `highestEnabledReconfigMode` should be enabled
    const enabledReconfigModesSet = new Set(
      reconfigModeKeys.filter(
        (mode) =>
          RECONFIG_MODES[mode].value <=
          RECONFIG_MODES[highestEnabledReconfigMode].value
      )
    )

    // Update class variables for external access
    this.highestEnabledReconfigMode = highestEnabledReconfigMode
    this.enabledReconfigModesSet = enabledReconfigModesSet
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
