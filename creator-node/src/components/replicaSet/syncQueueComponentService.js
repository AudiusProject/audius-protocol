/**
 * calls into SyncQueueService (via service registry?)
 * just enqueues sync job
 */

// takes in serviceRegistry to interact with syncService
const enqueueSync = async ({ syncQueueService }, walletPublicKeys, creatorNodeEndpoint) => {
  await syncQueueService.enqueueSync({
    walletPublicKeys, creatorNodeEndpoint
  })
}

module.exports = {
  enqueueSync
}