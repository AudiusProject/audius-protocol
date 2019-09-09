const Utils = require('../utils')

const TEN_SECONDS = 10000
const MAX_TRIES = 3

/** Check if the user's primary creator node is healthy */
const checkPrimaryHealthy = async (libs, primary, tries) => {
  const healthy = await Utils.isHealthy(primary)
  if (healthy) return healthy
  else {
    if (tries === 0) {
      return false
    }
    await Utils.wait(TEN_SECONDS)
    return checkPrimaryHealthy(libs, primary, tries - 1)
  }
}

/** Gets new endpoints from a user's secondaries */
const getNewEndpoints = async (libs, secondaries) => {
  for (const secondary of secondaries) {
    const { status, userBlockNumber } = await libs.creatorNode.getSyncStatus(secondary)
    if (status.blockNumber === userBlockNumber) {
      const index = secondaries.indexOf(secondary)
      const otherSecondaries = [...secondaries].splice(index, 1)
      return [secondary, ...otherSecondaries]
    }
  }
  throw new Error(`Could not find valid secondaries for user ${secondaries}`)
}

const rolloverNodes = async (libs) => {
  const user = libs.userStateManager.getCurrentUser()

  if (!user.is_creator) return

  const primary = libs.creatorNode.getPrimary(user.creator_node_endpoint)
  const healthy = await checkPrimaryHealthy(libs, primary, MAX_TRIES)
  if (healthy) return

  const secondaries = libs.creatorNode.getSecondaries(user.creator_node_endpoint)

  try {
    const newEndpoints = await getNewEndpoints(libs, secondaries)

    await libs.creatorNode.setEndpoint(newEndpoints[0])
    const newMetadata = { ...user }
    newMetadata.creator_node_endpoint = newEndpoints.join(',')
    await libs.User.updateCreator(user.user_id, newMetadata)
  } catch (e) {
    console.error(e)
  }
}

module.exports = rolloverNodes
