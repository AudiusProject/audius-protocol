const config = require('../../config')
const { logger } = require('../../logging')
const StateMonitoringQueue = require('./monitoring/StateMonitoringQueue')
const { updateCnodeEndpointToSpIdMap } = require('./nodeToSpIdManager')

// Modes used in issuing a reconfig. Each successive mode is a superset of the mode prior.
// The `key` of the reconfig states is used to identify the current reconfig mode.
// The `value` of the reconfig states is used in the superset logic of determining which type of
// reconfig is enabled.
const RECONFIG_MODES = Object.freeze({
  // Reconfiguration is entirely disabled
  RECONFIG_DISABLED: {
    key: 'RECONFIG_DISABLED',
    value: 0
  },
  // Reconfiguration is enabled only if one secondary is unhealthy
  ONE_SECONDARY: {
    key: 'ONE_SECONDARY',
    value: 1
  },
  // Reconfiguration is enabled for one secondary and multiple secondaries (currently two secondaries)
  MULTIPLE_SECONDARIES: {
    key: 'MULTIPLE_SECONDARIES',
    value: 2
  },
  // Reconfiguration is enabled for one secondary, multiple secondaries, a primary, and a primary and one secondary
  PRIMARY_AND_OR_SECONDARIES: {
    key: 'PRIMARY_AND_OR_SECONDARIES',
    value: 3
  },
  // Reconfiguration is enabled for one secondary, multiple secondaries, a primary, and a primary and one secondary,
  // and entire replica set
  // Note: this mode will probably be disabled.
  ENTIRE_REPLICA_SET: {
    key: 'ENTIRE_REPLICA_SET',
    value: 4
  }
})

const RECONFIG_MODE_KEYS = Object.keys(RECONFIG_MODES)

/**
 * Manages the queue for monitoring the state of Content Nodes and
 * the queue for reconciling anomalies in the state (syncs and replica set updates).
 */
class StateMachineManager {
  constructor() {
    this.updateEnabledReconfigModesSet()
    this.stateMonitoringQueue = new StateMonitoringQueue()
  }

  async init(audiusLibs) {
    await this.stateMonitoringQueue.init(audiusLibs)
    // TODO: Decide on interval to run this on
    try {
      updateCnodeEndpointToSpIdMap(audiusLibs.ethContracts)

      // Update enabledReconfigModesSet after successful `updateCnodeEndpointToSpIdMap()` call
      this.updateEnabledReconfigModesSet()
    } catch (e) {
      // Disable reconfig after failed update
      this.updateEnabledReconfigModesSet(
        /* override */ RECONFIG_MODES.RECONFIG_DISABLED.key
      )
      logger.error(`updateEndpointToSpIdMap Error: ${e.message}`)
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

    // Set mode to override if provided
    if (override) {
      highestEnabledReconfigMode = override

      // Else, set mode to config var, defaulting to RECONFIG_DISABLED if invalid
    } else {
      highestEnabledReconfigMode = RECONFIG_MODE_KEYS.includes(
        config.get('snapbackHighestReconfigMode')
      )
        ? config.get('snapbackHighestReconfigMode')
        : RECONFIG_MODES.RECONFIG_DISABLED.key
    }

    // All modes with lower rank than `highestEnabledReconfigMode` should be enabled
    const enabledReconfigModesSet = new Set(
      RECONFIG_MODE_KEYS.filter(
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
