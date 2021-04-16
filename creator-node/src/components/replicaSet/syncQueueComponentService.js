/**
 * calls into SyncQueueService (via service registry?)
 * just enqueues sync job
 */

// takes in serviceRegistry to interact with syncService
const enqueueSync = async ({ serviceRegistry, walletPublicKeys, creatorNodeEndpoint }) => {
  console.log(`SIDTEST SYNCQUEUESERVICE ENQUEUESYNC`)
  await serviceRegistry.syncQueueService.enqueueSync(
    { walletPublicKeys, creatorNodeEndpoint }
  )
}

module.exports = {
  enqueueSync
}
