/**
 * Syncs a creator node if its blocknubmer is behind the passed
 * in blocknumber.
 */
const syncNodeIfBehind = async (libs, blocknumber, endpoint) => {
  const { latestBlockNumber } = await libs.creatorNode.getSyncStatus(endpoint)
  if (latestBlockNumber < blocknumber) {
    await libs.creatorNode.syncSecondary(endpoint)
  }
}

const syncNodes = async (libs) => {
  const user = libs.userStateManager.getCurrentUser()

  if (!user.is_creator) return

  const blocknumber = user.blocknumber

  const secondaries = libs.creatorNode.getSecondaries(user.creator_node_endpoint)
  await Promise.all(secondaries.map(secondary => syncNodeIfBehind(libs, blocknumber, secondary)))
}

module.exports = syncNodes
