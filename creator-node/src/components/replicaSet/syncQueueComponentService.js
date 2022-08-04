/**
 * Enqueues sync operation into syncQueue for provided walletPublicKeys against provided creatorNodeEndpoint
 */
const enqueueSync = async (params) => {
  const { serviceRegistry } = params
  await serviceRegistry.syncQueue.enqueueSync(params)
}

const processImmediateSync = async (params) => {
  const { serviceRegistry, wallet, creatorNodeEndpoint, forceResyncConfig } =
    params
  await serviceRegistry.syncImmediateQueue.processImmediateSync({
    wallet,
    creatorNodeEndpoint,
    forceResyncConfig
  })
}

module.exports = {
  enqueueSync,
  processImmediateSync
}
