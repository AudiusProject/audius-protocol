/**
 * Syncs a creator node if its blocknubmer is behind the passed
 * in blocknumber.
 */
const syncNodeIfBehind = async (libs, endpoint) => {
  const { status, userBlockNumber } = await libs.creatorNode.getSyncStatus(endpoint)
  if (status.blockNumber < userBlockNumber) {
    await libs.creatorNode.syncSecondary(endpoint)
  }
}

const syncNodes = async (libs) => {
  const user = libs.userStateManager.getCurrentUser()

  if (!user.is_creator) return

  const secondaries = libs.creatorNode.getSecondaries(user.creator_node_endpoint)
  await Promise.all(secondaries.map(secondary => syncNodeIfBehind(libs, secondary)))
}

module.exports = syncNodes
