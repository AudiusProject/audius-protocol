const _ = require('lodash')

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

/**
 * Manages the queue for monitoring the state of Content Nodes and
 * the queue for reconciling anomalies in the state (syncs and replica set updates).
 */
class StateMachineManager {
  async init(audiusLibs, prometheusRegistry) {
    this.updateEnabledReconfigModesSet()

    await this.ensureCleanFilterOutAlreadyPresentDBEntriesRedisState()

    // Initialize queues
    const stateMonitoringManager = new StateMonitoringManager()
    const stateReconciliationManager = new StateReconciliationManager()
    const {
      monitorStateQueue,
      findSyncRequestsQueue,
      findReplicaSetUpdatesQueue
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

    // Upon completion, make queue jobs record metrics and enqueue other jobs as necessary
    const queueNameToQueueMap = {
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
        maxWaitingJobs: 1000
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
    for (const [queueName, { queue }] of Object.entries(queueNameToQueueMap)) {
      queue.on(
        'global:completed',
        makeOnCompleteCallback(
          queueName,
          queueNameToQueueMap,
          prometheusRegistry
        ).bind(this)
      )
    }

    return {
      monitorStateQueue,
      findSyncRequestsQueue,
      findReplicaSetUpdatesQueue,
      manualSyncQueue,
      recurringSyncQueue,
      updateReplicaSetQueue,
      recoverOrphanedDataQueue
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
