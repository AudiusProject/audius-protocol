const processSync = require('./processSync')
const { logger } = require('../../logging')
// Direct serviceRegistry require is necessary here since this module is run in a background process
const { serviceRegistry } = require('../../serviceRegistry')

/**
 * Processing logic for all jobs picked off bull queue in `SyncQueueService`
 *
 * - This may be run in a background process as a sandboxed processor, as per configs in `SyncQueueService`
 * - Swallows any sync failures silently - primary will handle re-triggering sync requests
 * - @dev TODO - consider recording failures in redis
 *
 * @param {Object} job bull job info
 */
const syncQueueJobProcessorFn = async (job) => {
  const { walletPublicKeys, creatorNodeEndpoint } = job.data

  await _ensureServiceRegistryInitialized()

  try {
    await processSync(serviceRegistry, walletPublicKeys, creatorNodeEndpoint)
  } catch (e) {
    logger.error(`processSync failure for wallets ${walletPublicKeys} against ${creatorNodeEndpoint}`, e.message)
  }
}

/**
 * This creates a bunch of problems -> every child process will re-initialized serviceRegistry, making this a lot more expensive
 * - also this does not fully init serviceRegistry -> notably, the child process does not recoverNodeL1Identity(),
 *    meaning it does not set `nodeConfig.get(spID)`. everything seems to work, but i'm pretty hesitant about this pattern.
 * - some thoughts, a better pattern may be to have some persistent child processes initialized at server startup that fully init
 *    only once, and are reused for all sync ops. can set num processes = numCPUs
 */
const _ensureServiceRegistryInitialized = async () => {
  if (!serviceRegistry.servicesInitialized) {
    await serviceRegistry.initServices()
  }
}

module.exports = syncQueueJobProcessorFn
