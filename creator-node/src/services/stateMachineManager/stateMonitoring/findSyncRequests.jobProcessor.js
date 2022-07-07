const _ = require('lodash')

const config = require('../../../config')
const CNodeToSpIdMapManager = require('../CNodeToSpIdMapManager')
const {
  SyncType,
  QUEUE_NAMES,
  SYNC_MODES
} = require('../stateMachineConstants')
const {
  getNewOrExistingSyncReq
} = require('../stateReconciliation/stateReconciliationUtils')
const { computeSyncModeForUserAndReplica } = require('./stateMonitoringUtils')

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')
const minSecondaryUserSyncSuccessPercent =
  config.get('minimumSecondaryUserSyncSuccessPercent') / 100
const minFailedSyncRequestsBeforeReconfig = config.get(
  'minimumFailedSyncRequestsBeforeReconfig'
)

/**
 * Processes a job to find and return sync requests that should be issued for the given array of users.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {Object[]} param.users array of { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet}
 * @param {string[]} param.unhealthyPeers array of unhealthy peers
 * @param {Object} param.replicaToUserInfoMap map(secondary endpoint => map(user wallet => { clock, filesHash }))
 * @param {string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }} param.userSecondarySyncMetricsMap mapping of each secondary to the success metrics the nodeUser has had syncing to it
 */
module.exports = async function ({
  users,
  unhealthyPeers,
  replicaToUserInfoMap,
  userSecondarySyncMetricsMap,
  logger
}) {
  _validateJobData(
    logger,
    users,
    unhealthyPeers,
    replicaToUserInfoMap,
    userSecondarySyncMetricsMap
  )

  const unhealthyPeersSet = new Set(unhealthyPeers || [])

  // Find any syncs that should be performed from each user to any of their secondaries
  let syncReqsToEnqueue = []
  let duplicateSyncReqs = []
  let errors = []
  for (const user of users) {
    const userSecondarySyncMetrics = userSecondarySyncMetricsMap[
      user.wallet
    ] || {
      [user.secondary1]: { successRate: 1, failureCount: 0 },
      [user.secondary2]: { successRate: 1, failureCount: 0 }
    }

    const {
      syncReqsToEnqueue: userSyncReqsToEnqueue,
      duplicateSyncReqs: userDuplicateSyncReqs,
      errors: userErrors
    } = await _findSyncsForUser(
      user,
      unhealthyPeersSet,
      userSecondarySyncMetrics,
      minSecondaryUserSyncSuccessPercent,
      minFailedSyncRequestsBeforeReconfig,
      replicaToUserInfoMap,
      logger
    )

    if (userSyncReqsToEnqueue?.length) {
      syncReqsToEnqueue = syncReqsToEnqueue.concat(userSyncReqsToEnqueue)
    } else if (userDuplicateSyncReqs?.length) {
      duplicateSyncReqs = duplicateSyncReqs.concat(userDuplicateSyncReqs)
    } else if (userErrors?.length) errors = errors.concat(userErrors)
  }

  return {
    duplicateSyncReqs,
    errors,
    jobsToEnqueue: syncReqsToEnqueue?.length
      ? {
          [QUEUE_NAMES.STATE_RECONCILIATION]: syncReqsToEnqueue
        }
      : {}
  }
}

const _validateJobData = (
  logger,
  users,
  unhealthyPeers,
  replicaToUserInfoMap,
  userSecondarySyncMetricsMap
) => {
  if (typeof logger !== 'object') {
    throw new Error(
      `Invalid type ("${typeof logger}") or value ("${logger}") of logger param`
    )
  }
  if (!(users instanceof Array)) {
    throw new Error(
      `Invalid type ("${typeof users}") or value ("${users}") of users param`
    )
  }
  if (!(unhealthyPeers instanceof Array)) {
    throw new Error(
      `Invalid type ("${typeof unhealthyPeers}") or value ("${unhealthyPeers}") of unhealthyPeers param`
    )
  }
  if (
    typeof replicaToUserInfoMap !== 'object' ||
    replicaToUserInfoMap instanceof Array
  ) {
    throw new Error(
      `Invalid type ("${typeof replicaToUserInfoMap}") or value ("${replicaToUserInfoMap}") of replicaToUserInfoMap`
    )
  }
  if (
    typeof userSecondarySyncMetricsMap !== 'object' ||
    userSecondarySyncMetricsMap instanceof Array
  ) {
    throw new Error(
      `Invalid type ("${typeof userSecondarySyncMetricsMap}") or value ("${userSecondarySyncMetricsMap}") of userSecondarySyncMetricsMap`
    )
  }
}

/**
 * Determines which sync requests should be sent for a given user to any of their secondaries.
 *
 * @param {Object} user { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet}
 * @param {Set<string>} unhealthyPeers set of unhealthy peers
 * @param {string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }} userSecondarySyncMetricsMap mapping of each secondary to the success metrics the user has had syncing to it
 * @param {number} minSecondaryUserSyncSuccessPercent 0-1 minimum sync success rate a secondary must have to perform a sync to it
 * @param {number} minFailedSyncRequestsBeforeReconfig minimum number of failed sync requests to a secondary before the user's replica set gets updated to not include the secondary
 * @param {Object} replicaToUserInfoMap map(secondary endpoint => map(user wallet => { clock value, filesHash }))
 */
const _findSyncsForUser = async (
  user,
  unhealthyPeers,
  userSecondarySyncMetricsMap,
  minSecondaryUserSyncSuccessPercent,
  minFailedSyncRequestsBeforeReconfig,
  replicaToUserInfoMap
) => {
  const syncReqsToEnqueue = []
  const duplicateSyncReqs = []
  const errors = []

  const {
    wallet,
    primary,
    secondary1,
    secondary2,
    secondary1SpID,
    secondary2SpID
  } = user

  // Only sync from this node to other nodes if this node is the user's primary
  if (primary !== thisContentNodeEndpoint) {
    return {}
  }

  const replicaSetNodesToObserve = [
    { endpoint: secondary1, spId: secondary1SpID },
    { endpoint: secondary2, spId: secondary2SpID }
  ]

  // filter out false-y values to account for incomplete replica sets
  const secondariesInfo = replicaSetNodesToObserve.filter(
    (entry) => entry.endpoint
  )

  // For each secondary, add a potential sync request if healthy
  for (const secondaryInfo of secondariesInfo) {
    const secondary = secondaryInfo.endpoint

    const { successRate, failureCount } = userSecondarySyncMetricsMap[secondary]

    // Secondary is unhealthy if we already marked it as unhealthy previously -- don't sync to it
    if (unhealthyPeers.has(secondary)) continue

    // Secondary is unhealthy if its spID is mismatched -- don't sync to it
    if (
      CNodeToSpIdMapManager.getCNodeEndpointToSpIdMap()[secondary] !==
      secondaryInfo.spId
    ) {
      continue
    }

    // Secondary has too low of a success rate -- don't sync to it
    if (
      failureCount >= minFailedSyncRequestsBeforeReconfig &&
      successRate < minSecondaryUserSyncSuccessPercent
    ) {
      continue
    }

    // Determine if secondary requires a sync by comparing its user data against primary (this node)
    const { clock: primaryClock, filesHash: primaryFilesHash } =
      replicaToUserInfoMap[primary][wallet]
    const { clock: secondaryClock, filesHash: secondaryFilesHash } =
      replicaToUserInfoMap[secondary][wallet]

    let syncMode
    try {
      syncMode = await computeSyncModeForUserAndReplica({
        wallet,
        primaryClock,
        secondaryClock,
        primaryFilesHash,
        secondaryFilesHash
      })
    } catch (e) {
      errors.push(
        `Error computing sync mode for user ${wallet} and secondary ${secondary} - ${e.message}`
      )
      continue
    }

    if (
      syncMode === SYNC_MODES.SyncSecondaryFromPrimary ||
      syncMode === SYNC_MODES.MergePrimaryAndSecondary
    ) {
      try {
        const { duplicateSyncReq, syncReqToEnqueue } = getNewOrExistingSyncReq({
          userWallet: wallet,
          primaryEndpoint: thisContentNodeEndpoint,
          secondaryEndpoint: secondary,
          syncType: SyncType.Recurring,
          syncMode
        })

        if (!_.isEmpty(syncReqToEnqueue)) {
          syncReqsToEnqueue.push(syncReqToEnqueue)
        } else if (!_.isEmpty(duplicateSyncReq)) {
          duplicateSyncReqs.push(duplicateSyncReq)
        }
      } catch (e) {
        errors.push(
          `Error getting new or existing sync request for syncMode ${syncMode}, user ${wallet} and secondary ${secondary} - ${e.message}`
        )
        continue
      }
    }
  }

  return {
    syncReqsToEnqueue,
    duplicateSyncReqs,
    errors
  }
}
