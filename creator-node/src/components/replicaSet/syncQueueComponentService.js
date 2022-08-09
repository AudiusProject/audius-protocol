/**
 * Enqueues sync operation into syncQueue for provided walletPublicKeys against provided creatorNodeEndpoint
 */
const enqueueSync = async ({
  serviceRegistry,
  walletPublicKeys,
  creatorNodeEndpoint,
  forceResync
}) => {
  await serviceRegistry.syncQueue.enqueueSync({
    walletPublicKeys,
    creatorNodeEndpoint,
    forceResync
  })
}

const processManualImmediateSync = async ({
  serviceRegistry,
  walletPublicKeys,
  creatorNodeEndpoint,
  forceResync
}) => {
  await serviceRegistry.syncImmediateQueue.processManualImmediateSync({
    walletPublicKeys,
    creatorNodeEndpoint,
    forceResync
  })
}

module.exports = {
  enqueueSync,
  processManualImmediateSync
}
