const axios = require('axios')
const _ = require('lodash')

const config = require('../../../config')
const models = require('../../../models')
const Utils = require('../../../utils')
const {
  MetricNames
} = require('../../prometheusMonitoring/prometheus.constants')
const {
  retrieveClockValueForUserFromReplica,
  makeHistogramToRecord
} = require('../stateMachineUtils')
const { getNewOrExistingSyncReq } = require('./stateReconciliationUtils')
const SyncRequestDeDuplicator = require('./SyncRequestDeDuplicator')
const SecondarySyncHealthTracker = require('./SecondarySyncHealthTracker')
const {
  SYNC_MONITORING_RETRY_DELAY_MS,
  QUEUE_NAMES,
  SYNC_MODES
} = require('../stateMachineConstants')
const primarySyncFromSecondary = require('../../sync/primarySyncFromSecondary')
const {
  computeSyncModeForUserAndReplica
} = require('../stateMonitoring/stateMonitoringUtils')

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')
const secondaryUserSyncDailyFailureCountThreshold = config.get(
  'secondaryUserSyncDailyFailureCountThreshold'
)
const maxSyncMonitoringDurationInMs = config.get(
  'maxSyncMonitoringDurationInMs'
)
const mergePrimaryAndSecondaryEnabled = config.get(
  'mergePrimaryAndSecondaryEnabled'
)

/**
 * Processes a job to issue a sync request from a user's primary (this node) to a user's secondary with syncType and syncMode
 * Secondary is specified in param.syncRequestParameters
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {string} param.syncType the type of sync (manual or recurring)
 * * @param {string} param.syncMode from SYNC_MODES object
 * @param {Object} param.syncRequestParameters axios params to make the sync request. Shape: { baseURL, url, method, data }
 */
module.exports = async function ({
  syncType,
  syncMode,
  syncRequestParameters,
  logger
}) {
  let jobsToEnqueue = {}
  let metricsToRecord = []
  let error = {}

  const startTimeMs = Date.now()

  const {
    syncReqToEnqueue: syncReqToEnqueueResp,
    result,
    error: errorResp
  } = await _handleIssueSyncRequest({
    syncType,
    syncMode,
    syncRequestParameters,
    logger
  })
  if (errorResp) {
    error = errorResp
    logger.error(error.message)
  }

  // Determine if new sync request needs to be enqueued
  let getNewOrExistingSyncReqError
  if (syncReqToEnqueueResp) {
    const {
      userWallet,
      secondaryEndpoint,
      syncMode: syncModeResp
    } = syncReqToEnqueueResp
    const { syncReqToEnqueue, duplicateSyncReq } = getNewOrExistingSyncReq({
      userWallet,
      secondaryEndpoint,
      primaryEndpoint: thisContentNodeEndpoint,
      syncType,
      syncMode: syncModeResp
    })
    if (!_.isEmpty(duplicateSyncReq)) {
      getNewOrExistingSyncReqError = {
        message:
          'Additional sync request was required but not able to be enqueued due to a duplicate',
        duplicateSyncReq
      }
    } else if (!_.isEmpty(syncReqToEnqueue)) {
      jobsToEnqueue = { [QUEUE_NAMES.STATE_RECONCILIATION]: [syncReqToEnqueue] }
    }
  }
  if (getNewOrExistingSyncReqError) {
    error = getNewOrExistingSyncReqError
    logger.error(error.message)
  }

  // Make metrics to record
  metricsToRecord = [
    makeHistogramToRecord(
      MetricNames.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM,
      (Date.now() - startTimeMs) / 1000, // Metric is in seconds
      {
        sync_type: _.snakeCase(syncType),
        sync_mode: _.snakeCase(syncMode),
        result: _.snakeCase(result)
      }
    )
  ]

  return {
    jobsToEnqueue,
    metricsToRecord,
    error
  }
}

async function _handleIssueSyncRequest({
  syncType,
  syncMode,
  syncRequestParameters,
  logger
}) {
  try {
    _validateJobData(syncType, syncMode, syncRequestParameters, logger)
  } catch (error) {
    return { result: 'failure_validate_job_data', error }
  }

  if (syncMode === SYNC_MODES.None) {
    return { result: 'success' }
  }

  const userWallet = syncRequestParameters.data.wallet[0]
  const secondaryEndpoint = syncRequestParameters.baseURL

  const logMsgString = `_handleIssueSyncRequest() (${syncType})(${syncMode}) User ${userWallet} | Secondary: ${secondaryEndpoint}`

  /**
   * Remove sync from SyncRequestDeDuplicator once it moves to Active status, before processing.
   * It is ok for two identical syncs to be present in Active and Waiting, just not two in Waiting
   */
  SyncRequestDeDuplicator.removeSync(syncType, userWallet, secondaryEndpoint)

  /**
   * Do not issue syncRequest if SecondaryUserSyncFailureCountForToday already exceeded threshold
   */
  const secondaryUserSyncFailureCountForToday =
    await SecondarySyncHealthTracker.getSecondaryUserSyncFailureCountForToday(
      secondaryEndpoint,
      userWallet,
      syncType
    )
  if (
    secondaryUserSyncFailureCountForToday >
    secondaryUserSyncDailyFailureCountThreshold
  ) {
    return {
      result: 'failure_secondary_failure_count_threshold_met',
      error: {
        message: `${logMsgString} || Secondary has already met SecondaryUserSyncDailyFailureCountThreshold (${secondaryUserSyncDailyFailureCountThreshold}). Will not issue further syncRequests today.`
      }
    }
  }

  /**
   * For now, if primarySyncFromSecondary fails, we just log & error without any retries
   * Eventually should make this more robust, but proceeding with caution
   */
  if (syncMode === SYNC_MODES.MergePrimaryAndSecondary) {
    // Short-circuit if this syncMode is disabled
    if (!mergePrimaryAndSecondaryEnabled) {
      return { result: 'success_mode_disabled' }
    }

    const error = await primarySyncFromSecondary({
      wallet: userWallet,
      secondary: secondaryEndpoint
    })

    if (error) {
      return {
        result: 'failure_primary_sync_from_secondary',
        error
      }
    }
  }

  /**
   * Issue sync request to secondary
   * - If SyncMode = MergePrimaryAndSecondary - issue sync request with forceResync = true
   *    - above call to primarySyncFromSecondary must have succeeded to get here
   *    - Only apply forceResync flag to this initial sync request, any future syncs proceed as usual
   */
  try {
    if (syncMode === SYNC_MODES.MergePrimaryAndSecondary) {
      const obj = {
        ...syncRequestParameters,
        data: { ...syncRequestParameters.data, forceResync: true }
      }
      await axios(obj)
    } else {
      await axios(syncRequestParameters)
    }
  } catch (e) {
    return {
      result: 'failure_issue_sync_request',
      error: {
        message: `${logMsgString} || Error issuing sync request: ${e.message}`
      },
      syncReqToEnqueue: {
        userWallet,
        secondaryEndpoint,
        syncMode: SYNC_MODES.SyncSecondaryFromPrimary
      }
    }
  }

  // primaryClockValue is used in additionalSyncIsRequired() call below
  const primaryClockValue = (await _getUserPrimaryClockValues([userWallet]))[
    userWallet
  ]

  // Wait until has sync has completed (within time threshold)
  const { outcome, syncReqToEnqueue } = await _additionalSyncIsRequired(
    userWallet,
    primaryClockValue,
    secondaryEndpoint,
    syncType,
    syncMode,
    logger
  )

  return {
    result: outcome,
    syncReqToEnqueue
  }
}

/**
 * Throw error on failure, else return nothing
 */
const _validateJobData = (syncType, syncMode, syncRequestParameters) => {
  if (typeof syncType !== 'string') {
    throw new Error(
      `Invalid type ("${typeof syncType}") or value ("${syncType}") of syncType param`
    )
  }

  if (typeof syncMode !== 'string') {
    throw new Error(
      `Invalid type ("${typeof syncMode}") or value ("${syncMode}") of syncMode param`
    )
  }

  if (
    typeof syncRequestParameters !== 'object' ||
    syncRequestParameters instanceof Array
  ) {
    throw new Error(
      `Invalid type ("${typeof syncRequestParameters}") or value ("${syncRequestParameters}") of syncRequestParameters`
    )
  }

  const isValidSyncJobData =
    'baseURL' in syncRequestParameters &&
    'url' in syncRequestParameters &&
    'method' in syncRequestParameters &&
    'data' in syncRequestParameters
  if (!isValidSyncJobData) {
    throw new Error(
      `Invalid sync data found: ${JSON.stringify(syncRequestParameters)}`
    )
  }

  if (
    !(syncRequestParameters.data.wallet instanceof Array) ||
    !syncRequestParameters.data.wallet?.length
  ) {
    throw new Error(
      `Invalid sync data wallets (expected non-empty array): ${syncRequestParameters.data.wallet}`
    )
  }
}

/**
 * Given wallets array, queries DB and returns a map of all users with
 *    those wallets and their clock values, or -1 if wallet not found
 *
 * @returns map(wallet -> clock val)
 */
const _getUserPrimaryClockValues = async (wallets) => {
  // Query DB for all cnodeUsers with walletPublicKey in `wallets` arg array
  const cnodeUsersFromDB = await models.CNodeUser.findAll({
    where: {
      walletPublicKey: {
        [models.Sequelize.Op.in]: wallets
      }
    }
  })

  // Initialize clock values for all users to -1
  const cnodeUserClockValuesMap = {}
  wallets.forEach((wallet) => {
    cnodeUserClockValuesMap[wallet] = -1
  })

  // Populate clock values into map with DB data
  cnodeUsersFromDB.forEach((cnodeUser) => {
    cnodeUserClockValuesMap[cnodeUser.walletPublicKey] = cnodeUser.clock
  })

  return cnodeUserClockValuesMap
}

/**
 * Monitor an ongoing sync operation for a given secondaryUrl and user wallet
 * Return boolean indicating if an additional sync is required and reason why (or 'none' if no additional sync is required)
 * Record SyncRequest outcomes to SecondarySyncHealthTracker
 */
const _additionalSyncIsRequired = async (
  userWallet,
  primaryClockValue = -1,
  secondaryUrl,
  syncType,
  syncMode,
  logger
) => {
  const logMsgString = `additionalSyncIsRequired() (${syncType}): wallet ${userWallet} secondary ${secondaryUrl} primaryClock ${primaryClockValue}`

  const startTimeMs = Date.now()
  const maxMonitoringTimeMs = startTimeMs + maxSyncMonitoringDurationInMs

  /**
   * Poll secondary for sync completion, up to `maxMonitoringTimeMs`
   */

  let secondaryCaughtUpToPrimary = false
  let initialSecondaryClock = null
  let finalSecondaryClock = null

  while (Date.now() < maxMonitoringTimeMs) {
    try {
      const secondaryClockValue = await retrieveClockValueForUserFromReplica(
        secondaryUrl,
        userWallet
      )
      logger.info(`${logMsgString} secondaryClock ${secondaryClockValue}`)

      // Record starting and current clock values for secondary to determine future action
      if (syncMode === SYNC_MODES.MergePrimaryAndSecondary) {
        initialSecondaryClock = -1
      } else if (initialSecondaryClock === null) {
        initialSecondaryClock = secondaryClockValue
      }
      finalSecondaryClock = secondaryClockValue

      /**
       * Stop monitoring if secondary has caught up to primary
       * Note - secondaryClockValue can be greater than primaryClockValue if additional
       *    data was written to primary after primaryClockValue was computed
       */
      if (secondaryClockValue >= primaryClockValue) {
        secondaryCaughtUpToPrimary = true
        break
      }
    } catch (e) {
      logger.warn(`${logMsgString} || Error: ${e.message}`)
    }

    // Delay between retries
    await Utils.timeout(SYNC_MONITORING_RETRY_DELAY_MS, false)
  }

  const monitoringTimeMs = Date.now() - startTimeMs

  /**
   * As Primary for user, record SyncRequest outcomes to all secondaries
   * Also check whether additional sync is required
   */
  let additionalSyncIsRequired
  let outcome
  if (secondaryCaughtUpToPrimary) {
    await SecondarySyncHealthTracker.recordSuccess(
      secondaryUrl,
      userWallet,
      syncType
    )
    outcome = 'success_secondary_caught_up'
    additionalSyncIsRequired = false
    logger.info(`${logMsgString} || Sync completed in ${monitoringTimeMs}ms`)

    // Secondary completed sync but is still behind primary since it was behind by more than max export range
    // Since syncs are all-or-nothing, if secondary clock has increased at all, we know it successfully completed sync
  } else if (finalSecondaryClock > initialSecondaryClock) {
    await SecondarySyncHealthTracker.recordSuccess(
      secondaryUrl,
      userWallet,
      syncType
    )
    additionalSyncIsRequired = true
    outcome = 'success_secondary_partially_caught_up'
    logger.info(
      `${logMsgString} || Secondary successfully synced from clock ${initialSecondaryClock} to ${finalSecondaryClock} but hasn't caught up to Primary. Enqueuing additional syncRequest.`
    )

    // (1) secondary did not catch up to primary AND (2) secondary did not complete sync
  } else {
    await SecondarySyncHealthTracker.recordFailure(
      secondaryUrl,
      userWallet,
      syncType
    )
    additionalSyncIsRequired = true
    outcome = 'failure_secondary_failed_to_progress'
    logger.error(
      `${logMsgString} || Secondary failed to progress from clock ${initialSecondaryClock}. Enqueuing additional syncRequest.`
    )
  }

  const response = { outcome }
  if (additionalSyncIsRequired) {
    response.syncReqToEnqueue = {
      userWallet,
      secondaryEndpoint: secondaryUrl,
      syncMode: SYNC_MODES.SyncSecondaryFromPrimary
    }
  }

  return response
}
