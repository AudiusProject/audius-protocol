const { addAndUpgradeUsers } = require('../../helpers.js')
const verifyValidCNs = require('./verifyValidCN')
const deregisterRandomCreatorNode = require('./deregisterRandomCreatorNode.js')
const stopRandomCreatorNode = require('./stopRandomCreatorNode.js')
const setNumCreatorNodes = require('./setNumCreatorNodes.js')
const { uploadTracksforUsers } = require('../../utils/uploadTracksForUsers')
const { logger } = require('../../logger')

const MAX_ATTEMPTS_TO_VALIDATE_REPLICA_SET = 20
const WAIT_INTERVAL_TO_UPDATE_REPLICA_SET_MS = 20000

/**
 * Tests that the user replica sets update when a node is deregistered or down
 */
const deregisterCN = async ({
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
    return { error: `[Snapback CN Deregistering] Issue with creating and upgrading users: ${e}` }
  }

  logger.info('[Snapback CN Deregistering] Start')
  for (let iteration = 0; iteration < iterations; iteration++) {
    creatorNodeIDToInfoMapping = await setNumCreatorNodes(numCreatorNodes, executeOne)

    // Upload tracks to users
    await uploadTracksforUsers({ executeAll, executeOne, walletIndexToUserIdMap })

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
        error: `[Snapback CN Deregistering] Error with verifying updated replica set: ${error.toString()}`
      }
    }
  }

  logger.info('[Snapback CN Deregistering] SUCCESS!')
}

const forceCNUnavailability = async ({
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
    return { error: `[Snapback CN Unavailability] Issue with creating and upgrading users: ${e}` }
  }

  logger.info('[Snapback CN Unavailability] Start')

  for (let iteration = 0; iteration < iterations; iteration++) {
    creatorNodeIDToInfoMapping = await setNumCreatorNodes(numCreatorNodes, executeOne)

    const {
      madDog,
      removedCreatorNodeId
    } = await stopRandomCreatorNode(creatorNodeIDToInfoMapping)

    let error = null
    let attempts = 0
    let passed = false
    while (attempts++ < MAX_ATTEMPTS_TO_VALIDATE_REPLICA_SET) {
      await new Promise(resolve => setTimeout(resolve, WAIT_INTERVAL_TO_UPDATE_REPLICA_SET_MS))
      try {
        await verifyValidCNs(executeOne, executeAll, removedCreatorNodeId, walletIndexToUserIdMap, creatorNodeIDToInfoMapping)
        passed = true
        break
      } catch (e) {
        error = e
      }
    }

    madDog.stop()

    if (!passed) {
      return {
        error: `[Snapback CN Unavailability] Error with verifying updated replica set: ${error.toString()}`
      }
    }
  }

  logger.info('[Snapback CN Unavailability] SUCCESS!')
}

module.exports = {
  deregisterCN,
  forceCNUnavailability
}
