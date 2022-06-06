const config = require('../../../config')
const CNodeToSpIdMapManager = require('../CNodeToSpIdMapManager')

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')
const minSecondaryUserSyncSuccessPercent =
  config.get('minimumSecondaryUserSyncSuccessPercent') / 100
const minFailedSyncRequestsBeforeReconfig = config.get(
  'minimumFailedSyncRequestsBeforeReconfig'
)

/**
 * Processes a job to find and return sync requests that
 * should potentially be issued for the given array of users.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {Object[]} param.users array of { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet}
 * @param {string[]} param.unhealthyPeers array of unhealthy peers
 * @param {Object} param.replicaSetNodesToUserClockStatusesMap map of secondary endpoint strings to (map of user wallet strings to clock value of secondary for user)
 * @param {string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }} param.userSecondarySyncMetricsMap mapping of each secondary to the success metrics the nodeUser has had syncing to it
 */
module.exports = async function ({
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

  const potentialSyncRequests = []
  const unhealthyPeersSet = new Set(unhealthyPeers || [])

  for (const user of users) {
    potentialSyncRequests.push(
      ..._findPotentialSyncRequestsForUser(
        user,
        thisContentNodeEndpoint,
        unhealthyPeersSet,
        userSecondarySyncMetricsMap,
        minSecondaryUserSyncSuccessPercent,
        minFailedSyncRequestsBeforeReconfig
      )
    )
  }

  return {
    potentialSyncRequests,
    replicaSetNodesToUserClockStatusesMap
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
 * Determines which sync requests should potentially be executed for a given user.
 * "Potentially" because an additional clock value check will be performed later before executing the sync.
 *
 * @param {Object} user { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet}
 * @param {string} thisContentNodeEndpoint URL or IP address of this Content Node
 * @param {Set<string>} unhealthyPeers set of unhealthy peers
 * @param {string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }} userSecondarySyncMetricsMap mapping of each secondary to the success metrics the nodeUser has had syncing to it
 * @param {number} minSecondaryUserSyncSuccessPercent 0-1 minimum sync success rate a secondary must have to perform a sync to it
 * @param {number} minFailedSyncRequestsBeforeReconfig minimum number of failed sync requests to a secondary before the user's replica set gets updated to not include the secondary
 */
const _findPotentialSyncRequestsForUser = (
  user,
  thisContentNodeEndpoint,
  unhealthyPeers,
  userSecondarySyncMetricsMap,
  minSecondaryUserSyncSuccessPercent,
  minFailedSyncRequestsBeforeReconfig
) => {
  const potentialSyncRequests = []

  const { primary, secondary1, secondary2, secondary1SpID, secondary2SpID } =
    user

  // Only sync from this node to other nodes if this node is the user's primary
  if (primary !== thisContentNodeEndpoint) return []

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

    // Secondary is unhealthy if we already marked it as unhealthy previously
    if (unhealthyPeers.has(secondary)) continue

    // Secondary is unhealthy if its spID is mismatched
    if (
      CNodeToSpIdMapManager.getCNodeEndpointToSpIdMap()[secondary] !==
      secondaryInfo.spId
    ) {
      continue
    }

    // No sync potential if syncs to this secondary have too low of a success rate
    if (
      failureCount >= minFailedSyncRequestsBeforeReconfig &&
      successRate < minSecondaryUserSyncSuccessPercent
    ) {
      continue
    }

    // Secondary is healthy so we can potentially sync the user's data to it from this primary
    potentialSyncRequests.push({ ...user, endpoint: secondary })
  }

  return potentialSyncRequests
}
