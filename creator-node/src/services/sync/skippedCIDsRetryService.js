const Bull = require('bull')
const _ = require('lodash')

const models = require('../../models')
const { logger } = require('../../logging')
const utils = require('../../utils')
const { saveFileForMultihashToFS } = require('../../fileManager')
const CIDFailureCountManager = require('./CIDFailureCountManager')

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
          logger.error(`${LogPrefix} Failed to process job || Error: ${e.message}`)
        }

        // Re-enqueue job after some interval
        await utils.timeout(SkippedCIDsRetryQueueJobIntervalMs, false)
        await this.queue.add({ startTime: Date.now() })

        done()
      }
    )
  }

  // Add first job to queue
  async init () {
    try {
      await this.queue.add({ startTime: Date.now() })
      logger.info(`${LogPrefix} Successfully initialized and enqueued initial job.`)
    } catch (e) {
      logger.error(`${LogPrefix} Failed to start`)
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
      }
    })

    // Shuffle files to make sure processing doesn't repeatedly hang on same files
    skippedFiles = _.shuffle(skippedFiles)

    let registeredGateways = await utils.getAllRegisteredCNodes(libs)
    registeredGateways = registeredGateways.map(nodeInfo => nodeInfo.endpoint)

    // Intentionally run sequentially to minimize node load
    const savedFiles = []
    for await (const file of skippedFiles) {
      // `saveFileForMultihashToFS()` will error on failure to retrieve/save
      try {
        await saveFileForMultihashToFS(serviceRegistry, logger, file.multihash, file.storagePath, registeredGateways, file.fileName)

        savedFiles.push(file)
      } catch (e) {
        // No need to log anything here, erroring is the default behavior
      }
    }

    // Update DB entries for all previously-skipped files that were successfully saved to flip `skipped` flag
    if (savedFiles.length) {
      const savedFileUUIDs = savedFiles.map(savedFile => savedFile.fileUUID)
      await models.File.update(
        { skipped: false },
        {
          where: { fileUUID: savedFileUUIDs }
        }
      )

      // Reset failure counts for successfully saved CIDs in CIDFailureCountManager
      savedFiles.forEach(savedFile => {
        CIDFailureCountManager.resetCIDFailureCount(savedFile.multihash)
      })
    }

    logger.info(`${LogPrefix} Completed run in ${Date.now() - startTimestampMs}ms. Processing files created >= ${oldestFileCreatedAtDate}. Successfully saved ${savedFiles.length} of total ${skippedFiles.length} processed.`)
  }
}

module.exports = SkippedCIDsRetryQueue
