/**
 * Enqueues sync operation into syncQueue for provided walletPublicKeys against provided creatorNodeEndpoint
 */
const enqueueSync = async ({
  serviceRegistry,
  walletPublicKeys,
  creatorNodeEndpoint,
  forceResync,
  parentSpanContext
}) => {
  await serviceRegistry.syncQueue.enqueueSync({
    walletPublicKeys,
    creatorNodeEndpoint,
    forceResync,
    parentSpanContext
  })
}

const processImmediateSync = async ({
  serviceRegistry,
  walletPublicKeys,
  creatorNodeEndpoint,
  forceResync,
  parentSpanContext
}) => {
  await serviceRegistry.syncImmediateQueue.processImmediateSync({
    walletPublicKeys,
    creatorNodeEndpoint,
    forceResync,
    parentSpanContext
  })
}

module.exports = {
  enqueueSync,
  processImmediateSync
}
