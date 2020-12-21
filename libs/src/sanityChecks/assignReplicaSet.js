const assignReplicaSet = async (libs, contentNodeWhitelist) => {
  console.debug('Sanity Check - addReplicaSet')

  const user = libs.userStateManager.getCurrentUser()

  // No-op conditions
  if (
    // There is no currently logged in user
    !user ||
    // The user already has a replica set assigned
    (user && user.creator_node_endpoint)
  ) return

  try {
    const metadata = await libs.User.assignReplicaSet({
      serviceProvider: libs.ServiceProvider,
      userId: user.user_id,
      passList: contentNodeWhitelist
    })

    console.debug(`Sanity Check - addReplicaSet - new nodes ${metadata.creator_node_endpoint}`)
  } catch (e) {
    console.error(e)
  }
}

module.exports = assignReplicaSet
