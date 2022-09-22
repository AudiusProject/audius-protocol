const _ = require('lodash')
const cluster = require('cluster')
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
const { clusterUtils } = require('../../utils')

/**
 * Manages the queue for monitoring the state of Content Nodes and
 * the queue for reconciling anomalies in the state (syncs and replica set updates).
 */
class StateMachineManager {
  async init(audiusLibs, prometheusRegistry) {
    this.updateEnabledReconfigModesSet()

    await this.ensureCleanFilterOutAlreadyPresentDBEntriesRedisState()

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
    } = await stateMonitoringManager.init(
      audiusLibs.discoveryProvider.discoveryProviderEndpoint,
      prometheusRegistry
    )
    const {
      manualSyncQueue,
      recurringSyncQueue,
      updateReplicaSetQueue,
      recoverOrphanedDataQueue
    } = await stateReconciliationManager.init(
      audiusLibs.discoveryProvider.discoveryProviderEndpoint,
      prometheusRegistry
    )

    if (cluster.worker?.id === 1) {
      await SyncRequestDeDuplicator.clear()
    }
    if (clusterUtils.isThisProcessSpecial()) {
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
          maxWaitingJobs: 100000
        },
        [QUEUE_NAMES.UPDATE_REPLICA_SET]: {
          queue: updateReplicaSetQueue,
          maxWaitingJobs: 10000
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
        queueEvents.on(
          'completed',
          makeOnCompleteCallback(
            queueName,
            queueNameToQueueMap,
            prometheusRegistry
          ).bind(this)
        )

        // Update the mapping in this StateMachineManager whenever a job successfully fetches it
        if (queueName === QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP) {
          queueEvents.on(
            'completed',
            this.updateMapOnMapFetchJobComplete.bind(this)
          )
        }
      }
    }

    return {
      monitorStateQueue,
      findSyncRequestsQueue,
      findReplicaSetUpdatesQueue,
      cNodeEndpointToSpIdMapQueue,
      manualSyncQueue,
      recurringSyncQueue,
      updateReplicaSetQueue,
      recoverOrphanedDataQueue
    }
  }

  /**
   * Deserializes the results of a job and updates the enabled reconfig modes to be either:
   * - enabled (to the highest enabled mode configured) if the job fetched the mapping successfully
   * - disabled if the job encountered an error fetching the mapping
   * @param {number} jobId the ID of the job that completed
   * @param {string} returnvalue the stringified JSON of the job's returnValue
   */
  updateMapOnMapFetchJobComplete({ jobId, returnvalue }, id) {
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
