const processSync = require('./processSync')

/**
 * TODO explain why this direct require is required -> can be run in separate process, does not have shared memory state, etc
 */
 const { serviceRegistry } = require('../../serviceRegistry')

/**
 * TODO clean up comment
 * - note this is run in isolated process
 * - note this swallos failures, primary will handle re-syncing
 * - add TODO to record failures in redis or something
 * Defines processing logic for all jobs as they are picked off SyncQueue
 * 
 * @param {Object} job
 */
const syncQueueJobProcessorFn = async (job) => {
  const { walletPublicKeys, creatorNodeEndpoint } = job.data

  await _ensureServiceRegistryInitialized()

  try {
    await processSync(serviceRegistry, walletPublicKeys, creatorNodeEndpoint)
  } catch (e) {
    console.log(`SIDTEST SYNCQUEUEJOBPROCESSORFN E`, e.message)
  }
}

const _ensureServiceRegistryInitialized = async () => {

}

module.exports = syncQueueJobProcessorFn