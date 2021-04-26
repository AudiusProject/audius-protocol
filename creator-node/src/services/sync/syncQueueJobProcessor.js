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
  logger.info(`SIDTEST SYNCQUEUEJOBPROCFN BEGIN SYNC FOR ${walletPublicKeys} & ${creatorNodeEndpoint}`)

  await _ensureServiceRegistryInitialized()

  try {
    await processSync(serviceRegistry, walletPublicKeys, creatorNodeEndpoint)
  } catch (e) {
    logger.error(`processSync failure for wallets ${walletPublicKeys} against ${creatorNodeEndpoint}`, e.message)
  }
}

const _ensureServiceRegistryInitialized = async () => {
  logger.info(`SIDTEST _ensureServiceRegistryInitialized STARTING`)
  if (!this.serviceRegistry.servicesInitialized) {
    await this.serviceRegistry.initServices()
  }

  if (!this.serviceRegistry.servicesThatRequireServerInitialized) {
    await this.serviceRegistry.initServicesThatRequireServer()
  }

  logger.info(`SIDTEST _ensureServiceRegistryInitialized STARTING`)
}

module.exports = syncQueueJobProcessorFn
