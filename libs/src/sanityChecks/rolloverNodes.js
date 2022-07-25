const { Utils } = require('../utils')
const { CreatorNode } = require('../services/creatorNode')

const THREE_SECONDS = 3000
const MAX_TRIES = 3

/** Check if the user's primary creator node is healthy */
const checkPrimaryHealthy = async (libs, primary, tries) => {
  const healthy = await Utils.isHealthy(primary)
  if (healthy) return healthy
  else {
    if (tries === 0) {
      return false
    }
    await Utils.wait(THREE_SECONDS)
    return checkPrimaryHealthy(libs, primary, tries - 1)
  }
}

/** Gets new endpoints from a user's secondaries */
const getNewPrimary = async (libs, secondaries) => {
  for (const secondary of secondaries) {
    const { isBehind } = await libs.creatorNode.getSyncStatus(secondary)
    if (!isBehind) {
      return secondary
    }
  }
  throw new Error(`Could not find valid secondaries for user ${secondaries}`)
}

const rolloverNodes = async (libs, creatorNodeWhitelist) => {
  console.debug('Sanity Check - rolloverNodes')
  const user = libs.userStateManager.getCurrentUser()

  if (!user || !user.is_creator) return

  const primary = CreatorNode.getPrimary(user.creator_node_endpoint)
  const healthy = await checkPrimaryHealthy(libs, primary, MAX_TRIES)
  if (healthy) return

  const secondaries = CreatorNode.getSecondaries(user.creator_node_endpoint)

  try {
    // Get a new primary
    const newPrimary = await getNewPrimary(libs, secondaries)
    const index = secondaries.indexOf(newPrimary)
    // Get new secondaries and backfill up to 2
    let newSecondaries = [...secondaries]
    newSecondaries.splice(index, 1)
    const autoselect = await libs.ServiceProvider.autoSelectCreatorNodes({
      numberOfNodes: 2 - newSecondaries.length,
      whitelist: creatorNodeWhitelist,
      // Exclude ones we currently have
      blacklist: new Set([newPrimary, ...newSecondaries]),
      preferHigherPatchForPrimary: libs.User.preferHigherPatchForPrimary,
      preferHigherPatchForSecondaries: libs.User.preferHigherPatchForSecondaries
    })
    newSecondaries = newSecondaries.concat([autoselect.primary, ...autoselect.secondaries])

    // Set the new endpoint and connect to it
    const newEndpoints = [newPrimary, ...newSecondaries]
    await libs.creatorNode.setEndpoint(newEndpoints[0])

    // Update the user
    const newMetadata = { ...user }
    newMetadata.creator_node_endpoint = newEndpoints.join(',')
    console.debug(`Sanity Check - rolloverNodes - new nodes ${newMetadata.creator_node_endpoint}`)
    await libs.User.updateCreator(user.user_id, newMetadata)
  } catch (e) {
    console.error(e)
  }
}

module.exports = rolloverNodes
