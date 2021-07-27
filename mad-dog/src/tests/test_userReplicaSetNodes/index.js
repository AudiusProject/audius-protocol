const { addAndUpgradeUsers } = require('../../helpers.js')
const verifyValidCNs = require('./verifyValidCN')
const deregisterRandomCreatorNode = require('./deregisterRandomCreatorNode.js')
const stopRandomCreatorNode = require('./stopRandomCreatorNode.js')
const setNumCreatorNodes = require('./setNumCreatorNodes.js')
const { uploadTracksforUsers } = require('../../utils/uploadTracksForUsers')
const { logger } = require('../../../../creator-node/src/logging.js')

const MAX_ATTEMPTS_TO_VALIDATE_REPLICA_SET = 10
const WAIT_INTERVAL_TO_UPDATE_REPLICA_SET_MS = 20000

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

  // Creates and initialize users if user does not exist. Else, uses existing users.
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

    // TODO: Implement spID as source of truth feature before uncommenting deregistration test code

    const deregisteredCreatorNodeId = await deregisterRandomCreatorNode(creatorNodeIDToInfoMapping)

    // Create a MadDog instance, responsible for taking down 1 node
    let attempts = 0
    let passed = false
    let error
    while (attempts++ < MAX_ATTEMPTS_TO_VALIDATE_REPLICA_SET) {
      await new Promise(resolve => setTimeout(resolve, WAIT_INTERVAL_TO_UPDATE_REPLICA_SET_MS))
      try {
        await verifyValidCNs(executeOne, executeAll, deregisteredCreatorNodeId, walletIndexToUserIdMap, creatorNodeIDToInfoMapping)
        passed = true
        break
      } catch (e) {
        error = e
      }
    }

    if (!passed) {
      return {
        error: `[Deregistering] Error with verifying updated replica set: ${error.toString()}`
      }
    }

    const {
      madDog,
      removedCreatorNodeId
    } = await stopRandomCreatorNode(creatorNodeIDToInfoMapping)

    error = null
    attempts = 0
    passed = false
    while (attempts++ < MAX_ATTEMPTS_TO_VALIDATE_REPLICA_SET) {
      await new Promise(resolve => setTimeout(resolve, WAIT_INTERVAL_TO_UPDATE_REPLICA_SET_MS))
      try {
        logger.info(`attempt ${attempts}`)
        await verifyValidCNs(executeOne, executeAll, removedCreatorNodeId, walletIndexToUserIdMap, creatorNodeIDToInfoMapping)
        passed = true
        break
      } catch (e) {
        error = e
      }
    }

    if (!passed) {
      return {
        error: `[Unavailability] Error with verifying updated replica set: ${error.toString()}`
      }
    }

    madDog.stop()
  }
}

module.exports = {
  userReplicaSetNodes
}
