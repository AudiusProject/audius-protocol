const assignReplicaSetIfNecessary = async (libs) => {
  try {
    await libs.User.assignReplicaSetIfNecessary()
  } catch (e) {
    // If sanity check fails, do not block main thread and log error
    console.error(e.message)
  }
}

module.exports = assignReplicaSetIfNecessary
