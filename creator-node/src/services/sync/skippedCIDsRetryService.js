const Bull = require('bull')

const models = require('../../models')
const { logger } = require('../../logging')
const utils = require('../../utils')
const { serviceRegistry } = require('../../serviceRegistry')
const { saveFileForMultihashToFS } = require('../../fileManager')


const SKIPPED_CIDS_RETRY_QUEUE_JOB_INTERVAL_DEFAULT_MS = 3600000 // 1hr in ms

const PROCESS_NAMES = Object.freeze({
  retrySkippedCIDs: 'retrySkippedCIDs'
})

/**
 * TODO construct + init this from serviceRegistry
 * can this be moved off the main process? is that worth doing now?
 */
class SkippedCIDsRetryQueue {

  constructor (nodeConfig) {

    this.queue = new Bull(
      'skipped-cids-retry-queue',
      {
        redis: {
          port: nodeConfig.get('redisPort'),
          host: nodeConfig.get('redisHost')
        },
        defaultJobOptions: {
          // these required since completed/failed jobs data set can grow infinitely until memory exhaustion
          removeOnComplete: true,
          removeOnFail: true
        }
      }
    )

    // Clean up anything that might be still stuck in the queue on restart
    this.queue.empty()

    const SkippedCIDsRetryQueueJobInterval = nodeConfig.get('skippedCIDsRetryQueueJobInterval') || SKIPPED_CIDS_RETRY_QUEUE_JOB_INTERVAL_DEFAULT_MS

    this.queue.process(
      PROCESS_NAMES.retrySkippedCIDs,
      /* concurrency */ 1,
      async (job, done) => {
        try {
          await this.process()
        } catch (e) {
          // TODO log error
        }

        // Re-enqueue job after some interval
        await utils.timeout(SkippedCIDsRetryQueueJobInterval)
        await this.queue.add({ startTime: Date.now() })
      }
    )
  }

  async init () {
    // TODO log starting recurring task

    try {
      // Kick off initial job
      await this.queue.add({ startTime: Date.now() })

    } catch (e) {
      // TODO log error
    }
  }

  /**
   * TODO add appropriate logging
   */
  async process () {
    // How long does this query take on a million rows? do we need an index on a boolean column
    const skippedFiles = await models.File.findAll({
      // exclude dir (?)
      // only select multihash
      where: {
        skipped: true
      }
    })

    // TODO Fetch list of currently registered replicas (should previously registered replicas be considered as well?)
    // is this computed elsewhere in CN on some interval that is accessible here? so we can avoid re-computing
    let registeredGateways

    // TODO convert to batched parallel (or should we? we don't care how long this takes, we just want to minimize its perf impact)
    for await (const file of skippedFiles) {
      try {
        await saveFileForMultihashToFS(serviceRegistry, logger, file.multihash, file.storagePath, registeredGateways, file.fileName)
      } catch (e) {
        // No need to log anything here, erroring is the default behavior
      }
    }
  }

}

module.exports = SkippedCIDsRetryQueue