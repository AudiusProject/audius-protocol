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
  parentSpan
}) => {
  await serviceRegistry.syncImmediateQueue.processImmediateSync({
    walletPublicKeys,
    creatorNodeEndpoint,
    forceResync,
    parentSpan
  })
}

module.exports = {
  enqueueSync,
  processImmediateSync
}
