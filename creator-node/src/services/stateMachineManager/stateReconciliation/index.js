const config = require('../../../config')
const { QUEUE_HISTORY, QUEUE_NAMES } = require('../stateMachineConstants')
const { makeQueue } = require('../stateMachineUtils')
const processJob = require('../processJob')
const { logger: baseLogger, createChildLogger } = require('../../../logging')
const handleSyncRequestJobProcessor = require('./issueSyncRequest.jobProcessor')

const manualSyncLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.MANUAL_SYNC
})

/**
 * Handles setup and job processing of the queue with jobs for:
 * - issuing sync requests to nodes (this can be other nodes or this node)
 * - updating user's replica sets when one or more nodes in their replica set becomes unhealthy
 */
class StateReconciliationManager {
  async init(prometheusRegistry) {
    const { queue: manualSyncQueue } = await makeQueue({
      name: QUEUE_NAMES.MANUAL_SYNC,
      processor: this.makeProcessJob(
        handleSyncRequestJobProcessor,
        manualSyncLogger,
        prometheusRegistry
      ).bind(this),
      logger: manualSyncLogger,
      concurrency: config.get('maxManualRequestSyncJobConcurrency'),
      removeOnComplete: QUEUE_HISTORY.MANUAL_SYNC,
      removeOnFail: QUEUE_HISTORY.MANUAL_SYNC,
      prometheusRegistry
    })

    return { manualSyncQueue }
  }

  makeProcessJob(processor, logger, prometheusRegistry) {
    return async (job) => processJob(job, processor, logger, prometheusRegistry)
  }
}

module.exports = StateReconciliationManager
