const Bull = require('bull')

const models = require('../../models')
const { logger } = require('../../logging')
const utils = require('../../utils')
const { serviceRegistry } = require('../../serviceRegistry')
const { saveFileForMultihashToFS } = require('../../fileManager')

const PROCESS_NAMES = Object.freeze({
  retrySkippedCIDs: 'retrySkippedCIDs'
})

const LogPrefix = '[SkippedCIDsRetryQueue]'

/**
 * TODO - consider moving queue/jobs off main process. Will require re-factoring of job processing
 */
class SkippedCIDsRetryQueue {
  constructor (nodeConfig, libs) {
    if (!nodeConfig || !libs) {
      throw new Error(`${LogPrefix} Cannot start without nodeConfig and libs`)
    }

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

    const SkippedCIDsRetryQueueJobInterval = nodeConfig.get('skippedCIDsRetryQueueJobInterval')
    const CIDMaxAgeMs = nodeConfig.get('skippedCIDRetryQueueMaxAgeHr') * 60 * 60 * 1000

    this.queue.process(
      PROCESS_NAMES.retrySkippedCIDs,
      /* concurrency */ 1,
      async (job, done) => {
        try {
          await this.process(CIDMaxAgeMs, libs)
        } catch (e) {
          logger.error(`${LogPrefix} Failed to process job || Error: ${e.message}`)
        }

        // Re-enqueue job after some interval
        await utils.timeout(SkippedCIDsRetryQueueJobInterval)
        await this.queue.add({ startTime: Date.now() })
      }
    )
  }

  // Add first job to queue
  async init () {
    try {
      await this.queue.add({ startTime: Date.now() })
      logger.info(`${LogPrefix} Starting...`)
    } catch (e) {
      logger.error(`${LogPrefix} Failed to start`)
    }
  }

  /**
   * Attempt to re-fetch all previously skipped files
   * Only process files with age <= maxAge
   */
  async process (CIDMaxAgeMs, libs) {
    const startTimestampMs = Date.now()
    const oldestFileCreatedAtDate = new Date(startTimestampMs - CIDMaxAgeMs)

    // Only process files with low age
    const skippedFiles = await models.File.findAll({
      where: {
        type: { [models.Sequelize.Op.ne]: 'dir' }, // skip over 'dir' type since there is no content to sync
        skipped: true,
        createdAt: { [models.Sequelize.Op.gte]: oldestFileCreatedAtDate }
      }
    })

    const registeredGateways = await utils.getAllRegisteredCNodes(libs)
    logger.info(`${LogPrefix} REGISTERED GATEWAYS ${JSON.stringify(registeredGateways)}`)

    // Intentionally run sequentially to minimize node load
    let savedCount = 0
    for await (const file of skippedFiles) {
      try {
        await saveFileForMultihashToFS(serviceRegistry, logger, file.multihash, file.storagePath, registeredGateways, file.fileName)
        savedCount++
      } catch (e) {
        // No need to log anything here, erroring is the default behavior
      }
    }

    logger.info(`${LogPrefix} Completed run in ${Date.now() - startTimestampMs}ms. Processed ${skippedFiles.length} files created >= ${oldestFileCreatedAtDate}. Successfully saved ${savedCount}.`)
  }
}

module.exports = SkippedCIDsRetryQueue
