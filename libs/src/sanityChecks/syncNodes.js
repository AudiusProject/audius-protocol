const { CreatorNode } = require('../services/creatorNode')
/**
 * Syncs a creator node if its blocknubmer is behind the passed
 * in blocknumber.
 */
const syncNodeIfBehind = async (libs, endpoint) => {
  try {
    const { isBehind, isConfigured } = await libs.creatorNode.getSyncStatus(endpoint)
    if (isBehind || !isConfigured) {
      console.debug(`Sanity Check - syncNodes - syncing ${endpoint}`)
      await libs.creatorNode.syncSecondary(endpoint)
    }
  } catch (e) {
    console.error(e)
  }
}

const syncNodes = async (libs) => {
  console.debug('Sanity Check - syncNodes')
  const user = libs.userStateManager.getCurrentUser()

  if (!user || !user.is_creator) return

  const secondaries = CreatorNode.getSecondaries(user.creator_node_endpoint)
  await Promise.all(secondaries.map(secondary => syncNodeIfBehind(libs, secondary)))
}

module.exports = syncNodes
