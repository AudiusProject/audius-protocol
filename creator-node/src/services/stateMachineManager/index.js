const config = require('../../config')
const { logger } = require('../../logging')
const StateMonitoringQueue = require('./stateMonitoring/StateMonitoringQueue')
const StateReconciliationQueue = require('./stateReconciliation/StateReconciliationQueue')
const NodeToSpIdManager = require('./CNodeToSpIdMapManager')
const { RECONFIG_MODES, JOB_NAMES } = require('./stateMachineConstants')
const QueueInterfacer = require('./QueueInterfacer')

/**
 * Manages the queue for monitoring the state of Content Nodes and
 * the queue for reconciling anomalies in the state (syncs and replica set updates).
 * Use QueueInterfacer for interfacing with the queues.
 */
class StateMachineManager {
  async init(audiusLibs) {
    this.updateEnabledReconfigModesSet()

    // TODO: Decide on interval to run this on
    try {
      NodeToSpIdManager.updateCnodeEndpointToSpIdMap(audiusLibs.ethContracts)

      // Update enabledReconfigModesSet after successful `updateCnodeEndpointToSpIdMap()` call
      this.updateEnabledReconfigModesSet()
    } catch (e) {
      // Disable reconfig after failed update
      this.updateEnabledReconfigModesSet(
        /* override */ RECONFIG_MODES.RECONFIG_DISABLED.key
      )
      logger.error(`updateEndpointToSpIdMap Error: ${e.message}`)
    }

    // Initialize queues
    const stateMonitoringQueue = new StateMonitoringQueue()
    const stateReconciliationQueue = new StateReconciliationQueue()
    await stateMonitoringQueue.init({
      audiusLibs,
      monitorStateJobSuccessCallback:
        this._enqueueFindSyncsAndReplicaSetUpdates.bind(this),
      findPotentialSyncsJobSuccessCallback:
        this._enqueueEnqueueSyncRequests.bind(this),
      findReplicaSetUpdatesJobSuccessCallback:
        this._enqueueUpdateReplicaSets.bind(this)
    })
    await stateReconciliationQueue.init()

    // Set up interfacer for job processors to use. This is a slightly hacky workaround
    // because job processors get their data from Redis and thus can't be passed the queue
    QueueInterfacer.init(
      audiusLibs,
      stateMonitoringQueue.queue,
      stateReconciliationQueue.queue
    )
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

  _enqueueFindSyncsAndReplicaSetUpdates(monitorStateJobResult) {
    const {
      users,
      unhealthyPeers,
      replicaSetNodesToUserClockStatusesMap,
      userSecondarySyncMetricsMap
    } = monitorStateJobResult

    QueueInterfacer.addStateMonitoringJob(
      JOB_NAMES.FIND_REPLICA_SET_UPDATES,
      /** data */
      {
        users,
        unhealthyPeers,
        replicaSetNodesToUserClockStatusesMap,
        userSecondarySyncMetricsMap
      }
    )
    QueueInterfacer.addStateMonitoringJob(
      JOB_NAMES.FIND_POTENTIAL_SYNCS,
      /** data */
      {
        users,
        unhealthyPeers,
        replicaSetNodesToUserClockStatusesMap,
        userSecondarySyncMetricsMap
      }
    )
  }

  _enqueueEnqueueSyncRequests(findPotentialSyncsJobResult) {
    const { potentialSyncRequests, replicaSetNodesToUserClockStatusesMap } =
      findPotentialSyncsJobResult
    if (!potentialSyncRequests) return

    QueueInterfacer.addStateReconciliationJob(
      JOB_NAMES.ENQUEUE_SYNC_REQUESTS,
      /** data */
      {
        potentialSyncRequests,
        replicaSetNodesToUserClockStatusesMap
      }
    )
  }

  _enqueueUpdateReplicaSets(findReplicaSetUpdatesJobResult) {
    const { updateReplicaSetOps, replicaSetNodesToUserClockStatusesMap } =
      findReplicaSetUpdatesJobResult
    for (const updateReplicaSetOp of updateReplicaSetOps) {
      QueueInterfacer.addStateReconciliationJob(
        JOB_NAMES.UPDATE_REPLICA_SET,
        /** data */
        {
          wallet: updateReplicaSetOp.wallet,
          userId: updateReplicaSetOp.user_id,
          primary: updateReplicaSetOp.primary,
          secondary1: updateReplicaSetOp.secondary1,
          secondary2: updateReplicaSetOp.secondary2,
          unhealthyReplicasSet: updateReplicaSetOp.unhealthyReplicas,
          replicaSetNodesToUserClockStatusesMap
        }
      )
    }
  }
}

module.exports = StateMachineManager
