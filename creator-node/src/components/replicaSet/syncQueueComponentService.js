
/**
 * Enqueues sync operation into syncQueue for provided walletPublicKeys against provided creatorNodeEndpoint
 */
const enqueueSync = async ({ serviceRegistry, walletPublicKeys, creatorNodeEndpoint }) => {
  await serviceRegistry.syncQueue.enqueueSync(
    { walletPublicKeys, creatorNodeEndpoint }
  )
}

module.exports = {
  enqueueSync
}
