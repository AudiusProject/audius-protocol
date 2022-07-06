const _ = require('lodash')

const config = require('../../config')
const { logger: baseLogger } = require('../../logging')
const StateMonitoringManager = require('./stateMonitoring')
const StateReconciliationManager = require('./stateReconciliation')
const NodeToSpIdManager = require('./CNodeToSpIdMapManager')
const { RECONFIG_MODES } = require('./stateMachineConstants')
const QueueInterfacer = require('./QueueInterfacer')
const makeOnCompleteCallback = require('./makeOnCompleteCallback')

/**
 * Manages the queue for monitoring the state of Content Nodes and
 * the queue for reconciling anomalies in the state (syncs and replica set updates).
 * Use QueueInterfacer for interfacing with the queues.
 */
class StateMachineManager {
  async init(audiusLibs, prometheusRegistry) {
    this.updateEnabledReconfigModesSet()

    // TODO: Remove this and libs another way -- maybe init a new instance for each updateReplicaSet job
    QueueInterfacer.init(audiusLibs)

    // Initialize queues
    const stateMonitoringManager = new StateMonitoringManager()
    const stateReconciliationManager = new StateReconciliationManager()
    const { stateMonitoringQueue, cNodeEndpointToSpIdMapQueue } =
      await stateMonitoringManager.init(
        audiusLibs.discoveryProvider.discoveryProviderEndpoint,
        prometheusRegistry
      )
    const { stateReconciliationQueue, manualSyncQueue } = await stateReconciliationManager.init(
      prometheusRegistry
    )

    // Upon completion, make jobs record metrics and enqueue other jobs as necessary
    stateMonitoringQueue.on(
      'global:completed',
      makeOnCompleteCallback(
        stateMonitoringQueue,
        stateReconciliationQueue,
        prometheusRegistry
      ).bind(this)
    )
    stateReconciliationQueue.on(
      'global:completed',
      makeOnCompleteCallback(
        stateMonitoringQueue,
        stateReconciliationQueue,
        prometheusRegistry
      ).bind(this)
    )

    // Update the mapping in this StateMachineManager whenever a job successfully fetches it
    cNodeEndpointToSpIdMapQueue.on(
      'global:completed',
      this.updateMapOnMapFetchJobComplete.bind(this)
    )

    this.manualSyncQueue.bind(manualSyncQueue)

    return {
      stateMonitoringQueue,
      cNodeEndpointToSpIdMapQueue,
      stateReconciliationQueue,
      manualSyncQueue
    }
  }

  /**
   * Deserializes the results of a job and updates the enabled reconfig modes to be either:
   * - enabled (to the highest enabled mode configured) if the job fetched the mapping successfully
   * - disabled if the job encountered an error fetching the mapping
   * @param {number} jobId the ID of the job that completed
   * @param {string} resultString the stringified JSON of the job's returnValue
   */
  async updateMapOnMapFetchJobComplete(jobId, resultString) {
    // Bull serializes the job result into redis, so we have to deserialize it into JSON
    let jobResult = {}
    try {
      jobResult = JSON.parse(resultString) || {}
    } catch (e) {
      baseLogger.warn(
        `Failed to parse cNodeEndpoint->spId map jobId ${jobId} result string: ${resultString}`
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
   * Issues syncRequest for user against secondary, and polls for replication up to primary
   * If secondary fails to sync within specified timeoutMs, will error
   */
     async issueSyncRequestsUntilSynced(
      secondaryUrl,
      wallet,
      primaryClockVal,
      timeoutMs
    ) {
      // Issue syncRequest before polling secondary for replication
      this.manualSyncQueue.add(

      )
      /*
      await this.enqueueSync({
        userWallet: wallet,
        secondaryEndpoint: secondaryUrl,
        primaryEndpoint: this.endpoint,
        syncType: SyncType.Manual,
        immediate: true
      })
      */
  
      // Poll clock status and issue syncRequests until secondary is caught up or until timeoutMs
      const start = Date.now()
      while (Date.now() - start < timeoutMs) {
        try {
          // Retrieve secondary clock status for user
          const secondaryClockStatusResp = await axios({
            method: 'get',
            baseURL: secondaryUrl,
            url: `/users/clock_status/${wallet}`,
            responseType: 'json',
            timeout: 1000 // 1000ms = 1s
          })
          const { clockValue: secondaryClockVal, syncInProgress } =
            secondaryClockStatusResp.data.data
  
          // If secondary is synced, return successfully
          if (secondaryClockVal >= primaryClockVal) {
            return
  
            // Else, if a sync is not already in progress on the secondary, issue a new SyncRequest
          } else if (!syncInProgress) {

      /*
            await this.enqueueSync({
              userWallet: wallet,
              secondaryEndpoint: secondaryUrl,
              primaryEndpoint: this.endpoint,
              syncType: SyncType.Manual
            })
      */
          }
  
          // Give secondary some time to process ongoing or newly enqueued sync
          // NOTE - we might want to make this timeout longer
          await Utils.timeout(500)
        } catch (e) {
          // do nothing and let while loop continue
        }
      }
  
      // This condition will only be hit if the secondary has failed to sync within timeoutMs
      throw new Error(
        `Secondary ${secondaryUrl} did not sync up to primary for user ${wallet} within ${timeoutMs}ms`
      )
    }
}

module.exports = StateMachineManager
