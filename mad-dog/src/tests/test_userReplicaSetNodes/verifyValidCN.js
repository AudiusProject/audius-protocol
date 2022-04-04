const _ = require('lodash')
const ServiceCommands = require('@audius/service-commands')

const { verifyUserReplicaSetStatus } = require('../test_userReplicaSetManager')
const { monitorAllUsersSyncStatus } = require('../test_snapbackSM')
const { getIDfromEndpoint } = require('./setNumCreatorNodes')

const { getUser } = ServiceCommands

const verifyCreatorNodeRemoved = async (executeAll, removedCnId, walletIndexToUserIdMap) => {
  const userReplicaSets = await executeAll(async (libs, i) => {
    const userId = walletIndexToUserIdMap[i]
    const usrQueryInfo = await getUser(libs, userId)
    // Deconstruct the comma separated value of enpdoint1,endoint2,endpoint3
    const replicaCNIDs = usrQueryInfo.creator_node_endpoint
      .split(',')
      .map(getIDfromEndpoint)
    return { userId: replicaCNIDs }
  })

  const replicaSets = userReplicaSets.reduce((acc, urs) => ({ ...acc, ...urs }), {})
  for (const userId in replicaSets) {
    const replicaIds = replicaSets[userId]
    if (replicaIds.some(cnId => cnId === removedCnId)) {
      throw new Error(`User ID: ${userId} has replica set: ${replicaIds}, but CN ${removedCnId} should be removed`)
    }
  }
}

const verifyUserReplicaSets = async (executeAll, walletIndexToUserIdMap, contentNodeIDToInfoMapping) => {
  const contentNodeEndpointToInfoMapping = Object.keys(contentNodeIDToInfoMapping).reduce((acc, id) => {
    const endpoint = contentNodeIDToInfoMapping[id].endpoint
    acc[endpoint] = contentNodeIDToInfoMapping[id]
    return acc
  }, {})
  // Verify replica state after users have been initialized
  await executeAll(async (libs, i) => {
    // Retrieve user id if known from walletIndexToUserIdMap
    // NOTE - It might be easier to just create a map of wallets instead of using 'index'
    const userId = walletIndexToUserIdMap[i]
    await verifyUserReplicaSetStatus(userId, libs, contentNodeEndpointToInfoMapping)
  })
}

/**
 * Checks that the removed creator node id is not present in any user's replica set
 * Checks that the user's metadata replica set matches their replica set on chain
 * Checks that the user's creator nodes are all synced w/ the user's data
 * @param {Function} executeOne Wrapper lib fn
 * @param {Function} executeAll Wrapper libs fn
 * @param {number} removedCNId ID of the removed creator node
 * @param {Object} walletIndexToUserIdMap wallet index to user id mapping
 * @param {Object} contentNodeIDToInfoMapping creator node id to serice provider info
 */
const verifyValidCNs = async (executeOne, executeAll, removedCNId, walletIndexToUserIdMap, contentNodeIDToInfoMapping) => {
  // Check Discovery for all user's replica set to ensure the cn is removed
  await verifyCreatorNodeRemoved(executeAll, removedCNId, walletIndexToUserIdMap)

  // Cross reference Discovery w/ the replcia set manager contract to
  // check that they are consistent
  await verifyUserReplicaSets(executeAll, walletIndexToUserIdMap, contentNodeIDToInfoMapping)

  // Ensure that all primary and seondary clock values for all users are the same
  await monitorAllUsersSyncStatus({ executeAll, executeOne })
}

module.exports = verifyValidCNs
