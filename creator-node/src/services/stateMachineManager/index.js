const _ = require('lodash')

const config = require('../../config')
const { logger: baseLogger } = require('../../logging')
const StateMonitoringManager = require('./stateMonitoring')
const StateReconciliationManager = require('./stateReconciliation')
const NodeToSpIdManager = require('./CNodeToSpIdMapManager')
const { RECONFIG_MODES } = require('./stateMachineConstants')
const QueueInterfacer = require('./QueueInterfacer')
const makeCompletedJobEnqueueOtherJobs = require('./makeCompletedJobEnqueueOtherJobs')

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
      baseLogger.error(`updateEndpointToSpIdMap Error: ${e.message}`)
    }

    // Initialize queues
    const stateMonitoringManager = new StateMonitoringManager()
    const stateReconciliationManager = new StateReconciliationManager()
    const stateMonitoringQueue = await stateMonitoringManager.init(
      audiusLibs.discoveryProvider.discoveryProviderEndpoint
    )
    const stateReconciliationQueue = await stateReconciliationManager.init()

    // Make jobs enqueue other jobs as necessary upon completion
    stateMonitoringQueue.on(
      'global:completed',
      makeCompletedJobEnqueueOtherJobs(
        stateMonitoringQueue,
        stateReconciliationQueue
      ).bind(this)
    )
    stateReconciliationQueue.on(
      'global:completed',
      makeCompletedJobEnqueueOtherJobs(
        stateMonitoringQueue,
        stateReconciliationQueue
      ).bind(this)
    )

    // TODO: Remove this and libs another way -- maybe init a new instance for each updateReplicaSet job
    QueueInterfacer.init(audiusLibs)

    return {
      stateMonitoringQueue,
      stateReconciliationQueue
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
}

module.exports = StateMachineManager
