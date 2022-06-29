const _ = require('lodash')

const config = require('../../../config')
const CNodeToSpIdMapManager = require('../CNodeToSpIdMapManager')
const { SyncType, QUEUE_NAMES } = require('../stateMachineConstants')
const {
  getNewOrExistingSyncReq
} = require('../stateReconciliation/stateReconciliationUtils')

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
 * @param {Object} param.replicaSetNodesToUserClockStatusesMap map of secondary endpoint strings to (map of user wallet strings to clock value of secondary for user)
 * @param {string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }} param.userSecondarySyncMetricsMap mapping of each secondary to the success metrics the nodeUser has had syncing to it
 */
module.exports = function ({
  logger,
  users,
  unhealthyPeers,
  replicaSetNodesToUserClockStatusesMap,
  userSecondarySyncMetricsMap
}) {
  _validateJobData(
    logger,
    users,
    unhealthyPeers,
    replicaSetNodesToUserClockStatusesMap,
    userSecondarySyncMetricsMap
  )

  const unhealthyPeersSet = new Set(unhealthyPeers || [])

  // Find any syncs that should be performed from each user to any of their secondaries
  let syncReqsToEnqueue = []
  let duplicateSyncReqs = []
  let errors = []
  for (const user of users) {
    const {
      syncReqsToEnqueue: userSyncReqsToEnqueue,
      duplicateSyncReqs: userDuplicateSyncReqs,
      errors: userErrors
    } = _findSyncsForUser(
      user,
      thisContentNodeEndpoint,
      unhealthyPeersSet,
      userSecondarySyncMetricsMap[user.wallet] || {
        [user.secondary1]: { successRate: 1, failureCount: 0 },
        [user.secondary2]: { successRate: 1, failureCount: 0 }
      },
      minSecondaryUserSyncSuccessPercent,
      minFailedSyncRequestsBeforeReconfig,
      replicaSetNodesToUserClockStatusesMap
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
  replicaSetNodesToUserClockStatusesMap,
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
    typeof replicaSetNodesToUserClockStatusesMap !== 'object' ||
    replicaSetNodesToUserClockStatusesMap instanceof Array
  ) {
    throw new Error(
      `Invalid type ("${typeof replicaSetNodesToUserClockStatusesMap}") or value ("${replicaSetNodesToUserClockStatusesMap}") of replicaSetNodesToUserClockStatusesMap`
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
 * @param {string} thisContentNodeEndpoint URL or IP address of this Content Node
 * @param {Set<string>} unhealthyPeers set of unhealthy peers
 * @param {string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }} userSecondarySyncMetricsMap mapping of each secondary to the success metrics the user has had syncing to it
 * @param {number} minSecondaryUserSyncSuccessPercent 0-1 minimum sync success rate a secondary must have to perform a sync to it
 * @param {number} minFailedSyncRequestsBeforeReconfig minimum number of failed sync requests to a secondary before the user's replica set gets updated to not include the secondary
 * @param {Object} replicaSetNodesToUserClockStatusesMap map of secondary endpoint strings to (map of user wallet strings to clock value of secondary for user)
 */
const _findSyncsForUser = (
  user,
  thisContentNodeEndpoint,
  unhealthyPeers,
  userSecondarySyncMetricsMap,
  minSecondaryUserSyncSuccessPercent,
  minFailedSyncRequestsBeforeReconfig,
  replicaSetNodesToUserClockStatusesMap
) => {
  const syncReqsToEnqueue = []
  const duplicateSyncReqs = []
  const errors = []

  const { primary, secondary1, secondary2, secondary1SpID, secondary2SpID } =
    user

  // Only sync from this node to other nodes if this node is the user's primary
  if (primary !== thisContentNodeEndpoint) return {}

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

    // Secondary have too low of a success rate -- don't sync to it
    if (
      failureCount >= minFailedSyncRequestsBeforeReconfig &&
      successRate < minSecondaryUserSyncSuccessPercent
    ) {
      continue
    }

    // Determine if secondary requires a sync by comparing clock values against primary (this node)
    const { wallet } = user
    const userPrimaryClockVal =
      replicaSetNodesToUserClockStatusesMap[primary][wallet]
    const userSecondaryClockVal =
      replicaSetNodesToUserClockStatusesMap[secondary][wallet]

    // Secondary is healthy and has lower clock value, so we want to sync the user's data to it from this primary
    if (userPrimaryClockVal > userSecondaryClockVal) {
      try {
        const { duplicateSyncReq, syncReqToEnqueue } = getNewOrExistingSyncReq({
          userWallet: wallet,
          secondaryEndpoint: secondary,
          primaryEndpoint: thisContentNodeEndpoint,
          syncType: SyncType.Recurring
        })
        if (!_.isEmpty(syncReqToEnqueue)) {
          syncReqsToEnqueue.push(syncReqToEnqueue)
        } else if (!_.isEmpty(duplicateSyncReq)) {
          duplicateSyncReqs.push(duplicateSyncReq)
        }
      } catch (e) {
        errors.push(
          `Error getting new or existing sync request for user ${wallet} and secondary ${secondary} - ${e.message}`
        )
      }
    }
  }

  return {
    syncReqsToEnqueue,
    duplicateSyncReqs,
    errors
  }
}
