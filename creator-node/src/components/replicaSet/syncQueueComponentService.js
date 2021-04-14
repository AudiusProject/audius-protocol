/**
 * calls into SyncQueueService (via service registry?)
 * just enqueues sync job
 */

// takes in serviceRegistry to interact with syncService
const enqueueSync = async (serviceRegistry, walletPublicKeys, creatorNodeEndpoint) => {
  console.log(`SIDEST ENQUEUESYNC SYNCQUEUESERVICE: ${JSON.stringify(serviceRegistry.syncQueueService)}`)
  await serviceRegistry.syncQueueService.enqueueSync({
    walletPublicKeys, creatorNodeEndpoint, serviceRegistry
  })
}

module.exports = {
  enqueueSync
}
