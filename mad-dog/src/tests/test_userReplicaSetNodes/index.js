const { addAndUpgradeUsers } = require('../../helpers.js')
const verifyValidCNs = require('./verifyValidCN')
const deregisterRandomCreatorNode = require('./deregisterRandomCreatorNode.js')
const stopRandomCreatorNode = require('./stopRandomCreatorNode.js')
const setNumCreatorNodes = require('./setNumCreatorNodes.js')
const { uploadTracksforUsers } = require('../../utils/uploadTracksForUsers')

/**
 * Tests that the user replica sets update when a node is deregistered or down
 */
const userReplicaSetNodes = async ({
  numUsers = 10,
  numCreatorNodes = 10,
  iterations,
  executeAll,
  executeOne
}) => {

  let creatorNodeIDToInfoMapping = {}

  let walletIndexToUserIdMap = {}
  // Create users
  // Initialize users
  try {
    walletIndexToUserIdMap = await addAndUpgradeUsers(
      numUsers,
      executeAll,
      executeOne
    )
  } catch (e) {
    return { error: `Issue with creating and upgrading users: ${e}` }
  }


  for (let iteration = 0; iteration < iterations; iteration++) {
    creatorNodeIDToInfoMapping = await setNumCreatorNodes(numCreatorNodes, executeOne)

    // Upload tracks to users
    await uploadTracksforUsers({ executeAll, executeOne, walletIndexToUserIdMap })

    const deregisteredCreatorNodeId = await deregisterRandomCreatorNode(creatorNodeIDToInfoMapping)

    await new Promise(resolve => setTimeout(resolve, 10 * 1000))
    await verifyValidCNs(executeOne, executeAll, deregisteredCreatorNodeId, walletIndexToUserIdMap, creatorNodeIDToInfoMapping)

    // Create a MadDog instance, responsible for taking down 1 node
    const {
      madDog,
      removedCreatorNodeId
    } = await stopRandomCreatorNode(creatorNodeIDToInfoMapping)
    await new Promise(resolve => setTimeout(resolve, 20 * 1000))

    await verifyValidCNs(executeOne, executeAll, removedCreatorNodeId, walletIndexToUserIdMap, creatorNodeIDToInfoMapping)
    madDog.stop()
  }
}

module.exports = {
  userReplicaSetNodes
}
