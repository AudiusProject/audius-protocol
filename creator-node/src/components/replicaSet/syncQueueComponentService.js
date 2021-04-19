/**
 * Enqueues sync operation into syncQueueService for provided walletPublicKeys against provided creatorNodeEndpoint
 */
const enqueueSync = async ({ serviceRegistry, walletPublicKeys, creatorNodeEndpoint }) => {
  await serviceRegistry.syncQueueService.enqueueSync(
    { walletPublicKeys, creatorNodeEndpoint }
  )
}

module.exports = {
  enqueueSync
}
