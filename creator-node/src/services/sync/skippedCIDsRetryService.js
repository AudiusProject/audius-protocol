const Bull = require('bull')

const models = require('../../models')
const { logger } = require('../../logging')
const utils = require('../../utils')
const { saveFileForMultihashToFS } = require('../../fileManager')

const LogPrefix = '[SkippedCIDsRetryQueue]'

/**
 * TODO - consider moving queue/jobs off main process. Will require re-factoring of job processing / dependencies
 */
class SkippedCIDsRetryQueue {
  constructor (nodeConfig, libs, serviceRegistry) {
    if (!nodeConfig || !libs || !serviceRegistry) {
      throw new Error(`${LogPrefix} Cannot start without nodeConfig, libs, and serviceRegistry`)
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

    const SkippedCIDsRetryQueueJobIntervalMs = nodeConfig.get('skippedCIDsRetryQueueJobIntervalMs')
    const CIDMaxAgeMs = nodeConfig.get('skippedCIDRetryQueueMaxAgeHr') * 60 * 60 * 1000 // convert from Hr to Ms

    this.queue.process(
      async (job, done) => {
        try {
          await this.process(CIDMaxAgeMs, libs, serviceRegistry)
        } catch (e) {
          this.logError(`Failed to process job || Error: ${e.message}`)
        }

        // Re-enqueue job after some interval
        await utils.timeout(SkippedCIDsRetryQueueJobIntervalMs, false)
        await this.queue.add({ startTime: Date.now() })

        done()
      }
    )
  }

  logInfo (msg) {
    logger.info(`${LogPrefix} ${msg}`)
  }

  logError (msg) {
    logger.error(`${LogPrefix} ${msg}`)
  }

  // Add first job to queue
  async init () {
    try {
      await this.queue.add({ startTime: Date.now() })
      this.logInfo(`Successfully initialized and enqueued initial job.`)
    } catch (e) {
      this.logError(`Failed to start`)
    }
  }

  /**
   * Attempt to re-fetch all previously skipped files
   * Only process files with age <= maxAge
   */
  async process (CIDMaxAgeMs, libs, serviceRegistry) {
    const startTimestampMs = Date.now()
    const oldestFileCreatedAtDate = new Date(startTimestampMs - CIDMaxAgeMs)

    // Only process files with createdAt >= oldest createdAt
    let skippedFiles = await models.File.findAll({
      where: {
        type: { [models.Sequelize.Op.ne]: 'dir' }, // skip over 'dir' type since there is no content to sync
        skipped: true,
        createdAt: { [models.Sequelize.Op.gte]: oldestFileCreatedAtDate }
      },
      // Order by createdAt desc to make sure old, unavailable files do not repeatedly delay processing
      order: [['createdAt', 'DESC']]
    })

    let registeredGateways = await utils.getAllRegisteredCNodes(libs)
    registeredGateways = registeredGateways.map(nodeInfo => nodeInfo.endpoint)

    // Intentionally run sequentially to minimize node load
    const savedFileUUIDs = []
    for await (const file of skippedFiles) {
      // Returns boolean success indicator
      const success = await saveFileForMultihashToFS(serviceRegistry, logger, file.multihash, file.storagePath, registeredGateways, file.fileName)
      if (success) {
        savedFileUUIDs.push(file.fileUUID)
      }
      // Do nothing on failure, since that is the default behavior
    }

    // Update DB entries for all previously-skipped files that were successfully saved to flip `skipped` flag
    if (savedFileUUIDs.length) {
      await models.File.update(
        { skipped: false },
        {
          where: { fileUUID: savedFileUUIDs }
        }
      )
    }

    this.logInfo(`Completed run in ${Date.now() - startTimestampMs}ms. Processing files created >= ${oldestFileCreatedAtDate}. Successfully saved ${savedFileUUIDs.length} of total ${skippedFiles.length} processed.`)
  }
}

module.exports = SkippedCIDsRetryQueue
