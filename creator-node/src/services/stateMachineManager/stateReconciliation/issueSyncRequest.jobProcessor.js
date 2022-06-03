const axios = require('axios')

const { logger } = require('../../../logging')
const config = require('../../../config')
const models = require('../../../models')
const Utils = require('../../../utils')
const { retrieveClockValueForUserFromReplica } = require('../stateMachineUtils')
const { enqueueSyncRequest } = require('./stateReconciliationUtils')
const SyncRequestDeDuplicator = require('./SyncRequestDeDuplicator')
const SecondarySyncHealthTracker = require('./SecondarySyncHealthTracker')
const { SYNC_MONITORING_RETRY_DELAY_MS } = require('../stateMachineConstants')

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
 * @param {number} jobId the id of the job being run
 * @param {string} syncType the type of sync (manual or recurring)
 * @param {Object} syncRequestParameters axios params to make the sync request. Shape: { baseURL, url, method, data }
 */
module.exports = async function (jobId, syncType, syncRequestParameters) {
  const isValidSyncJobData =
    'baseURL' in syncRequestParameters &&
    'url' in syncRequestParameters &&
    'method' in syncRequestParameters &&
    'data' in syncRequestParameters
  if (!isValidSyncJobData) {
    logger.error(`Invalid sync data found`, syncRequestParameters)
    return
  }

  const userWallet = syncRequestParameters.data.wallet[0]
  const secondaryEndpoint = syncRequestParameters.baseURL

  const logMsgString = `(${syncType}) User ${userWallet} | Secondary: ${secondaryEndpoint}`

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
    logger.error(
      `${logMsgString} || Secondary has already met SecondaryUserSyncDailyFailureCountThreshold (${secondaryUserSyncDailyFailureCountThreshold}). Will not issue further syncRequests today.`
    )
    return
  }

  // primaryClockValue is used in additionalSyncIsRequired() call below
  const primaryClockValue = (await _getUserPrimaryClockValues([userWallet]))[
    userWallet
  ]

  logger.info(
    `------------------Process SYNC | ${logMsgString} | Primary clock value ${primaryClockValue} | jobId: ${jobId}------------------`
  )

  // Issue sync request to secondary
  try {
    await axios(syncRequestParameters)
  } catch (e) {
    // Axios request will throw on non-200 response -> swallow error to ensure below logic is executed
    logger.error(`${logMsgString} || Error issuing sync request: ${e.message}`)
  }

  // Wait until has sync has completed (within time threshold)
  const additionalSyncIsRequired = await _additionalSyncIsRequired(
    userWallet,
    primaryClockValue,
    secondaryEndpoint,
    syncType
  )

  // Re-enqueue sync if required
  if (additionalSyncIsRequired) {
    await enqueueSyncRequest({
      userWallet,
      secondaryEndpoint,
      primaryEndpoint: thisContentNodeEndpoint,
      syncType
    })
  }

  logger.info(
    `------------------END Process SYNC | ${logMsgString} | jobId: ${jobId}------------------`
  )
  return {}
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
 * Return boolean indicating if an additional sync is required
 * Record SyncRequest outcomes to SecondarySyncHealthTracker
 */
const _additionalSyncIsRequired = async (
  userWallet,
  primaryClockValue = -1,
  secondaryUrl,
  syncType
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
      logger.debug(`${logMsgString} secondaryClock ${secondaryClockValue}`)

      // Record starting and current clock values for secondary to determine future action
      if (initialSecondaryClock === null) {
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
  if (secondaryCaughtUpToPrimary) {
    await SecondarySyncHealthTracker.recordSuccess(
      secondaryUrl,
      userWallet,
      syncType
    )
    additionalSyncIsRequired = false
    logger.debug(`${logMsgString} || Sync completed in ${monitoringTimeMs}ms`)

    // Secondary completed sync but is still behind primary since it was behind by more than max export range
    // Since syncs are all-or-nothing, if secondary clock has increased at all, we know it successfully completed sync
  } else if (finalSecondaryClock > initialSecondaryClock) {
    await SecondarySyncHealthTracker.recordSuccess(
      secondaryUrl,
      userWallet,
      syncType
    )
    additionalSyncIsRequired = true
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
    logger.error(
      `${logMsgString} || Secondary failed to progress from clock ${initialSecondaryClock}. Enqueuing additional syncRequest.`
    )
  }

  return additionalSyncIsRequired
}
