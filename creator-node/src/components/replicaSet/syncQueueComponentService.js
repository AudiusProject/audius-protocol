/**
 * Enqueues sync operation into syncQueue for provided walletPublicKeys against provided creatorNodeEndpoint
 */
const enqueueSync = async (params) => {
  const { serviceRegistry } = params
  await serviceRegistry.syncQueue.enqueueSync(params)
}

const processSyncOfTypeImmediate = async (params) => {
  const { serviceRegistry, wallet, creatorNodeEndpoint, forceResyncConfig } =
    params
  await serviceRegistry.syncImmediateQueue.processSyncOfTypeImmediate({
    wallet,
    creatorNodeEndpoint,
    forceResyncConfig
  })
}

module.exports = {
  enqueueSync,
  processSyncOfTypeImmediate
}
