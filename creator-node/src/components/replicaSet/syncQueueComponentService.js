/**
 * Enqueues sync operation into syncQueue for provided walletPublicKeys against provided creatorNodeEndpoint
 * @param {Object} params See the SyncQueue for explicit params
 */
const enqueueSync = async (params) => {
  const { serviceRegistry } = params
  await serviceRegistry.syncQueue.enqueueSync(params)
}

/**
 * Enqueues an sync of MANUAL that will operate immediately
 * @param {Object} params See the SyncImmediateQueue for explicit params
 */
const processManualImmediateSync = async (params) => {
  const { serviceRegistry } = params
  await serviceRegistry.syncImmediateQueue.processManualImmediateSync(params)
}

module.exports = {
  enqueueSync,
  processManualImmediateSync
}
