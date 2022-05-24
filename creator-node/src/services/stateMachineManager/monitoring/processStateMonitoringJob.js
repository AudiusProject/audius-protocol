const config = require('../../../config')
const { logger } = require('../../../logging')
const NodeHealthManager = require('../nodeHealthManager')
const NodeToSpIdManager = require('../nodeToSpIdManager')
const {
  getNodeUsers,
  buildReplicaSetNodesToUserWalletsMap,
  computeUserSecondarySyncSuccessRatesMap,
  aggregateReconfigAndPotentialSyncOps
} = require('./utils')
const {
  retrieveClockStatusesForUsersAcrossReplicaSet
} = require('../clockUtils')

// Number of users to process each time processStateMonitoringJob is called
const USERS_PER_JOB = config.get('snapbackUsersPerJob')
const THIS_CNODE_ENDPOINT = config.get('creatorNodeEndpoint')

/**
 * Processes a job to monitor the current state of `numUsersToProcess` users.
 * Returns the syncs and replica set updates that are required for these users.
 * @param {number} jobId the id of the job being run
 * @param {number} lastProcessedUserId the highest ID of the user that was most recently processed
 * @param {string} discoveryNodeEndpoint the IP address / URL of a Discovery Node to make requests to
 * @param {number} moduloBase (DEPRECATED)
 * @param {number} currentModuloSlice (DEPRECATED)
 * @return {Object} { lastProcessedUserId (number), jobFailed (boolean) }
 */
const processStateMonitoringJob = async (
  jobId,
  lastProcessedUserId,
  discoveryNodeEndpoint,
  moduloBase, // TODO: Remove. https://linear.app/audius/issue/CON-146/clean-up-modulo-slicing-after-all-dns-update-to-support-pagination
  currentModuloSlice // TODO: Remove. https://linear.app/audius/issue/CON-146/clean-up-modulo-slicing-after-all-dns-update-to-support-pagination
) => {
  // Record all stages of this function along with associated information for use in logging
  const decisionTree = []
  _addToDecisionTree(decisionTree, jobId, 'BEGIN processStateMonitoringJob', {
    lastProcessedUserId,
    discoveryNodeEndpoint,
    moduloBase, // TODO: Remove. https://linear.app/audius/issue/CON-146/clean-up-modulo-slicing-after-all-dns-update-to-support-pagination
    currentModuloSlice, // TODO: Remove. https://linear.app/audius/issue/CON-146/clean-up-modulo-slicing-after-all-dns-update-to-support-pagination
    THIS_CNODE_ENDPOINT,
    USERS_PER_JOB
  })

  let jobFailed = false
  let nodeUsers = []
  // New DN versions support pagination, so we fall back to modulo slicing for old versions
  // TODO: Remove modulo supports once all DNs update to include https://github.com/AudiusProject/audius-protocol/pull/3071
  try {
    try {
      nodeUsers = await getNodeUsers(
        discoveryNodeEndpoint,
        THIS_CNODE_ENDPOINT,
        lastProcessedUserId,
        USERS_PER_JOB
      )

      // Backwards compatibility -- DN will return all users if it doesn't have pagination.
      // In that case, we have to manually paginate the full set of users
      // TODO: Remove. https://linear.app/audius/issue/CON-146/clean-up-modulo-slicing-after-all-dns-update-to-support-pagination
      if (nodeUsers.length > USERS_PER_JOB) {
        nodeUsers = sliceUsers(nodeUsers, moduloBase, currentModuloSlice)
      }

      _addToDecisionTree(
        decisionTree,
        jobId,
        'getNodeUsers and sliceUsers Success',
        { nodeUsersLength: nodeUsers.length }
      )
    } catch (e) {
      _addToDecisionTree(
        decisionTree,
        jobId,
        'getNodeUsers or sliceUsers Error',
        { error: e.message }
      )
      throw new Error(
        `processStateMonitoringJob getNodeUsers or sliceUsers Error: ${e.toString()}`
      )
    }

    let unhealthyPeers
    try {
      unhealthyPeers = await NodeHealthManager.getUnhealthyPeers(nodeUsers)
      _addToDecisionTree(decisionTree, jobId, 'getUnhealthyPeers Success', {
        unhealthyPeerSetLength: unhealthyPeers.size,
        unhealthyPeers: Array.from(unhealthyPeers)
      })
    } catch (e) {
      _addToDecisionTree(
        decisionTree,
        jobId,
        'processStateMonitoringJob getUnhealthyPeers Error',
        { error: e.message }
      )
      throw new Error(
        `processStateMonitoringJob getUnhealthyPeers Error: ${e.toString()}`
      )
    }

    // Build map of <replica set node : [array of wallets that are on this replica set node]>
    const replicaSetNodesToUserWalletsMap =
      buildReplicaSetNodesToUserWalletsMap(nodeUsers)
    _addToDecisionTree(
      decisionTree,
      jobId,
      'buildReplicaSetNodesToUserWalletsMap Success',
      {
        numReplicaSetNodes: Object.keys(replicaSetNodesToUserWalletsMap).length
      }
    )

    // Retrieve clock statuses for all users and their current replica sets
    let replicaSetNodesToUserClockStatusesMap
    try {
      // Set mapping of replica endpoint to (mapping of wallet to clock value)
      const clockStatusResp =
        await retrieveClockStatusesForUsersAcrossReplicaSet(
          replicaSetNodesToUserWalletsMap
        )
      replicaSetNodesToUserClockStatusesMap =
        clockStatusResp.replicasToUserClockStatusMap

      // Mark peers as unhealthy if they were healthy before but failed to return a clock value
      unhealthyPeers = new Set([
        ...unhealthyPeers,
        ...clockStatusResp.unhealthyPeers
      ])

      _addToDecisionTree(
        decisionTree,
        jobId,
        'retrieveClockStatusesForUsersAcrossReplicaSet Success'
      )
    } catch (e) {
      _addToDecisionTree(
        decisionTree,
        jobId,
        'retrieveClockStatusesForUsersAcrossReplicaSet Error',
        { error: e.message }
      )
      throw new Error(
        'processStateMonitoringJob retrieveClockStatusesForUsersAcrossReplicaSet Error'
      )
    }

    // Retrieve success metrics for all users syncing to their secondaries
    let userSecondarySyncMetricsMap = {}
    try {
      userSecondarySyncMetricsMap =
        await computeUserSecondarySyncSuccessRatesMap(nodeUsers)
      _addToDecisionTree(
        decisionTree,
        jobId,
        'computeUserSecondarySyncSuccessRatesMap Success',
        {
          userSecondarySyncMetricsMapLength: Object.keys(
            userSecondarySyncMetricsMap
          ).length
        }
      )
    } catch (e) {
      _addToDecisionTree(
        decisionTree,
        jobId,
        'computeUserSecondarySyncSuccessRatesMap Error',
        { error: e.message }
      )
      throw new Error(
        'processStateMonitoringJob computeUserSecondarySyncSuccessRatesMap Error'
      )
    }

    // Find sync requests that need to be issued and ReplicaSets that need to be updated
    const { requiredUpdateReplicaSetOps, potentialSyncRequests } =
      await aggregateReconfigAndPotentialSyncOps(
        nodeUsers,
        unhealthyPeers,
        userSecondarySyncMetricsMap,
        NodeToSpIdManager.getCNodeEndpointToSpIdMap(),
        THIS_CNODE_ENDPOINT
      )
    _addToDecisionTree(
      decisionTree,
      jobId,
      'Build requiredUpdateReplicaSetOps and potentialSyncRequests arrays',
      {
        requiredUpdateReplicaSetOpsLength: requiredUpdateReplicaSetOps.length,
        potentialSyncRequestsLength: potentialSyncRequests.length
      }
    )
  } catch (e) {
    logger.info(`processStateMonitoringJob ERROR: ${e.toString()}`)
    jobFailed = true
  } finally {
    _addToDecisionTree(decisionTree, jobId, 'END processStateMachineOperation')

    // Log decision tree
    _printDecisionTree(decisionTree, jobId)
  }

  // The next job should start processing where this one ended or loop back around to the first user
  const lastProcessedUser = nodeUsers[nodeUsers.length - 1] || {
    user_id: 0
  }
  return {
    lastProcessedUserId: lastProcessedUser?.user_id || 0,
    jobFailed
  }
}

const _addToDecisionTree = (
  decisionTree,
  jobId,
  stage,
  data = {},
  log = true
) => {
  const obj = { stage, data, time: Date.now() }

  let logStr = `jobId ${jobId} processStateMonitoringJob ${stage} - Data ${JSON.stringify(
    data
  )}`

  if (decisionTree.length > 0) {
    // Set duration if both objs have time field
    const lastObj = decisionTree[decisionTree.length - 1]
    if (lastObj && lastObj.time) {
      const duration = obj.time - lastObj.time
      obj.duration = duration
      logStr += ` - Duration ${duration}ms`
    }
  }
  decisionTree.push(obj)

  if (log) {
    logger.info(logStr)
  }
}

const _printDecisionTree = (decisionTree, jobId, msg = '') => {
  // Compute and record `fullDuration`
  if (decisionTree.length > 2) {
    const startTime = decisionTree[0].time
    const endTime = decisionTree[decisionTree.length - 1].time
    const duration = endTime - startTime
    decisionTree[decisionTree.length - 1].fullDuration = duration
  }
  try {
    logger.info(
      `jobId ${jobId} processStateMonitoringJob Decision Tree${
        msg ? ` - ${msg} - ` : ''
      }${JSON.stringify(decisionTree)}`
    )
  } catch (e) {
    logger.error(
      `Error printing jobId ${jobId} processStateMonitoringJob Decision Tree ${decisionTree}`
    )
  }
}

/**
 * Select chunk of users to process in this run
 *  - User is selected if (user_id % moduloBase = currentModuloSlice)
 * @param {Object[]} nodeUsers array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
 */
const sliceUsers = (nodeUsers, moduloBase, currentModuloSlice) => {
  return nodeUsers.filter(
    (nodeUser) => nodeUser.user_id % moduloBase === currentModuloSlice
  )
}

module.exports = processStateMonitoringJob
