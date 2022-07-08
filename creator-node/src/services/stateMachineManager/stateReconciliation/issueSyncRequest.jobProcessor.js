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

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')
const secondaryUserSyncDailyFailureCountThreshold = config.get(
  'secondaryUserSyncDailyFailureCountThreshold'
)
const maxSyncMonitoringDurationInMs = config.get(
  'maxSyncMonitoringDurationInMs'
)

/**
 * Processes a job to issue a request to perform a manual or recurring sync (determined by syncType param).
 * The sync request syncs a user's data from this node (the user's primary)
 * to another node (one of the user's secondaries).
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {string} param.syncType the type of sync (manual or recurring)
 * @param {Object} param.syncRequestParameters axios params to make the sync request. Shape: { baseURL, url, method, data }
 */
module.exports = async function ({
  logger,
  syncType,
  syncMode,
  syncRequestParameters
}) {
  _validateJobData(logger, syncType, syncRequestParameters)

  const isValidSyncJobData =
    'baseURL' in syncRequestParameters &&
    'url' in syncRequestParameters &&
    'method' in syncRequestParameters &&
    'data' in syncRequestParameters
  if (!isValidSyncJobData) {
    const errorMsg = `Invalid sync data found: ${syncRequestParameters}`
    logger.error(errorMsg)
    return {
      error: {
        message: errorMsg
      }
    }
  }
  if (
    !(syncRequestParameters.data.wallet instanceof Array) ||
    !syncRequestParameters.data.wallet?.length
  ) {
    const errorMsg = `Invalid sync data wallets (expected non-empty array): ${syncRequestParameters.data.wallet}`
    logger.error(errorMsg)
    return {
      error: {
        message: errorMsg
      }
    }
  }

  const userWallet = syncRequestParameters.data.wallet[0]
  const secondaryEndpoint = syncRequestParameters.baseURL

  const logMsgString = `(${syncType})(${syncMode}) User ${userWallet} | Secondary: ${secondaryEndpoint}`

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
    const errorMsg = `${logMsgString} || Secondary has already met SecondaryUserSyncDailyFailureCountThreshold (${secondaryUserSyncDailyFailureCountThreshold}). Will not issue further syncRequests today.`
    logger.error(errorMsg)
    return {
      error: {
        message: errorMsg
      }
    }
  }

  if (syncMode === SYNC_MODES.MergePrimaryAndSecondary) {
    const error = await primarySyncFromSecondary(secondaryEndpoint, userWallet)

    if (error) {
    }
  }

  // primaryClockValue is used in additionalSyncIsRequired() call below
  const primaryClockValue = (await _getUserPrimaryClockValues([userWallet]))[
    userWallet
  ]

  logger.info(
    `------------------Process SYNC | ${logMsgString} | Primary clock value ${primaryClockValue}------------------`
  )

  // Issue sync request to secondary with forceResync = true
  try {
    const syncRequestParametersForceResync = {
      ...syncRequestParameters,
      data: { ...syncRequestParameters.data, forceResync: true }
    }
    await axios(syncRequestParametersForceResync)
  } catch (e) {
    // Axios request will throw on non-200 response -> swallow error to ensure below logic is executed
    logger.error(`${logMsgString} || Error issuing sync request: ${e.message}`)
  }

  // Wait until has sync has completed (within time threshold)
  const startWaitingForCompletion = Date.now()
  const { additionalSyncIsRequired, reasonForAdditionalSync } =
    await _additionalSyncIsRequired(
      userWallet,
      primaryClockValue,
      secondaryEndpoint,
      syncType,
      syncMode,
      logger
    )

  const metricsToRecord = [
    makeHistogramToRecord(
      MetricNames.ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM,
      (Date.now() - startWaitingForCompletion) / 1000, // Metric is in seconds
      {
        syncType: _.snakeCase(syncType),
        reason_for_additional_sync: reasonForAdditionalSync
      }
    )
  ]

  // Re-enqueue sync if required
  let error = {}
  let additionalSyncReq = {}
  if (additionalSyncIsRequired) {
    const { syncReqToEnqueue, duplicateSyncReq } = getNewOrExistingSyncReq({
      userWallet,
      secondaryEndpoint,
      primaryEndpoint: thisContentNodeEndpoint,
      syncType,
      syncMode: SYNC_MODES.SyncSecondaryFromPrimary
    })
    if (duplicateSyncReq && !_.isEmpty(duplicateSyncReq)) {
      error = {
        message:
          'Additional sync request was required but not able to be enqueued due to a duplicate',
        duplicateSyncReq
      }
    } else if (syncReqToEnqueue) {
      additionalSyncReq = syncReqToEnqueue
    }
  }

  logger.info(
    `------------------END Process SYNC | ${logMsgString}------------------`
  )

  return {
    error,
    jobsToEnqueue: _.isEmpty(additionalSyncReq)
      ? {}
      : {
          [QUEUE_NAMES.STATE_RECONCILIATION]: [additionalSyncReq]
        },
    metricsToRecord
  }
}

const _validateJobData = (logger, syncType, syncRequestParameters) => {
  if (typeof logger !== 'object') {
    throw new Error(
      `Invalid type ("${typeof logger}") or value ("${logger}") of logger param`
    )
  }
  if (typeof syncType !== 'string') {
    throw new Error(
      `Invalid type ("${typeof syncType}") or value ("${syncType}") of syncType param`
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
        initialSecondaryClock = 0
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
      logger.error(`${logMsgString} || Error: ${e.message}`)
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
  let reasonForAdditionalSync = 'none'
  if (secondaryCaughtUpToPrimary) {
    await SecondarySyncHealthTracker.recordSuccess(
      secondaryUrl,
      userWallet,
      syncType
    )
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
    reasonForAdditionalSync = 'secondary_progressed_too_slow'
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
    reasonForAdditionalSync = 'secondary_failed_to_progress'
    logger.error(
      `${logMsgString} || Secondary failed to progress from clock ${initialSecondaryClock}. Enqueuing additional syncRequest.`
    )
  }

  return { additionalSyncIsRequired, reasonForAdditionalSync }
}
