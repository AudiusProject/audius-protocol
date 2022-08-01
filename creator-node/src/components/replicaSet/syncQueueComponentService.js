/**
 * Enqueues sync operation into syncQueue for provided walletPublicKeys against provided creatorNodeEndpoint
 */
const enqueueSync = async ({
  serviceRegistry,
  wallet,
  creatorNodeEndpoint,
  blockNumber,
  forceResyncConfig
}) => {
  await serviceRegistry.syncQueue.enqueueSync({
    wallet,
    creatorNodeEndpoint,
    blockNumber,
    forceResyncConfig
  })
}

module.exports = {
  enqueueSync
}
