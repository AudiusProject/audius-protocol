/**
 * Enqueues sync operation into syncQueue for provided walletPublicKeys against provided creatorNodeEndpoint
 */
const enqueueSync = async (params) => {
  const { serviceRegistry } = params
  await serviceRegistry.syncQueue.enqueueSync(params)
}

module.exports = {
  enqueueSync
}
