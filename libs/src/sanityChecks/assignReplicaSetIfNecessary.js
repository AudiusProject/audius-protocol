const CreatorNode = require('../services/creatorNode/index')

const assignReplicaSetIfNecessary = async (libs) => {
  const user = libs.userStateManager.getCurrentUser()

  // If no user is logged in, or a creator node endpoint is already assigned,
  // skip this call
  if (!user || user.creator_node_endpoint) return

  // Generate a replica set and assign to user
  try {
    const { primary, secondaries } = await libs.ServiceProvider.autoSelectCreatorNodes({})
    const contentNodeEndpoint = CreatorNode.buildEndpoint(primary, secondaries)
    const currentEndpoint = libs.userStateManager.getCurrentUser().creator_node_endpoint
    await libs.User.upgradeToCreator(currentEndpoint, contentNodeEndpoint, false)
  } catch (e) {
    // If for some reason this fails, log error and allow user to continue
    console.error(`assignReplicaSetIfNecessary error - ${e.toString()}`)
  }
}

module.exports = assignReplicaSetIfNecessary
