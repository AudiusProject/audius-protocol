const config = require('../../../config')
const { logger } = require('../../../logging')
const NodeHealthManager = require('../CNodeHealthManager')
const {
  getNodeUsers,
  buildReplicaSetNodesToUserWalletsMap,
  computeUserSecondarySyncSuccessRatesMap
} = require('./stateMonitoringUtils')
const {
  retrieveClockStatusesForUsersAcrossReplicaSet
} = require('../stateMachineUtils')

// Number of users to process each time processStateMonitoringJob is called
const USERS_PER_JOB = config.get('snapbackUsersPerJob')
const THIS_CNODE_ENDPOINT = config.get('creatorNodeEndpoint')

/**
 * Processes a job to monitor the current state of `USERS_PER_JOB` users.
 * Returns state data for the slice of users processed and the Content Nodes affiliated with them.
 * @param {number} jobId the id of the job being run
 * @param {number} lastProcessedUserId the highest ID of the user that was most recently processed
 * @param {string} discoveryNodeEndpoint the IP address / URL of a Discovery Node to make requests to
 * @param {number} moduloBase (DEPRECATED)
 * @param {number} currentModuloSlice (DEPRECATED)
 * @return {Object} {
 *   lastProcessedUserId (number),
 *   jobFailed (boolean),
 *   users (array of objects),
 *   unhealthyPeers (set of content node endpoint strings),
 *   secondarySyncMetrics (object),
 *   replicaSetNodesToUserClockStatusesMap (object),
 *   userSecondarySyncMetricsMap (object)
 * }
 */
module.exports = async function (
  jobId,
  lastProcessedUserId,
  discoveryNodeEndpoint,
  moduloBase, // TODO: Remove. https://linear.app/audius/issue/CON-146/clean-up-modulo-slicing-after-all-dns-update-to-support-pagination
  currentModuloSlice // TODO: Remove. https://linear.app/audius/issue/CON-146/clean-up-modulo-slicing-after-all-dns-update-to-support-pagination
) {
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
  let users = []
  let unhealthyPeers = new Set()
  let replicaSetNodesToUserClockStatusesMap = {}
  let userSecondarySyncMetricsMap = {}
  // New DN versions support pagination, so we fall back to modulo slicing for old versions
  // TODO: Remove modulo supports once all DNs update to include https://github.com/AudiusProject/audius-protocol/pull/3071
  try {
    try {
      users = await getNodeUsers(
        discoveryNodeEndpoint,
        THIS_CNODE_ENDPOINT,
        lastProcessedUserId,
        USERS_PER_JOB
      )

      // Backwards compatibility -- DN will return all users if it doesn't have pagination.
      // In that case, we have to manually paginate the full set of users
      // TODO: Remove. https://linear.app/audius/issue/CON-146/clean-up-modulo-slicing-after-all-dns-update-to-support-pagination
      if (users.length > USERS_PER_JOB) {
        users = sliceUsers(users, moduloBase, currentModuloSlice)
      }

      _addToDecisionTree(
        decisionTree,
        jobId,
        'getNodeUsers and sliceUsers Success',
        { nodeUsersLength: users?.length }
      )
    } catch (e) {
      // Make the next job try again instead of looping back to userId 0
      users = [{ user_id: lastProcessedUserId }]

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

    try {
      unhealthyPeers = await NodeHealthManager.getUnhealthyPeers(users)
      _addToDecisionTree(decisionTree, jobId, 'getUnhealthyPeers Success', {
        unhealthyPeerSetLength: unhealthyPeers?.size,
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
      buildReplicaSetNodesToUserWalletsMap(users)
    _addToDecisionTree(
      decisionTree,
      jobId,
      'buildReplicaSetNodesToUserWalletsMap Success',
      {
        numReplicaSetNodes: Object.keys(replicaSetNodesToUserWalletsMap)?.length
      }
    )

    // Retrieve clock statuses for all users and their current replica sets
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
    try {
      userSecondarySyncMetricsMap =
        await computeUserSecondarySyncSuccessRatesMap(users)
      _addToDecisionTree(
        decisionTree,
        jobId,
        'computeUserSecondarySyncSuccessRatesMap Success',
        {
          userSecondarySyncMetricsMapLength: Object.keys(
            userSecondarySyncMetricsMap
          )?.length
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
  } catch (e) {
    logger.info(`processStateMonitoringJob ERROR: ${e.toString()}`)
    jobFailed = true
  } finally {
    _addToDecisionTree(decisionTree, jobId, 'END processStateMachineOperation')

    // Log decision tree
    _printDecisionTree(decisionTree, jobId)
  }

  // The next job should start processing where this one ended or loop back around to the first user
  const lastProcessedUser = users[users.length - 1] || {
    user_id: 0
  }
  return {
    lastProcessedUserId: lastProcessedUser?.user_id || 0,
    jobFailed,
    users,
    unhealthyPeers,
    replicaSetNodesToUserClockStatusesMap,
    userSecondarySyncMetricsMap
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
