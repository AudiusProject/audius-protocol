const Bull = require('bull')
const config = require('../config.js')
const fs = require('fs')
const { logger } = require('../logging')
const { updateBlockchainIds } = require('./utils')
const { processDownloadAppEmail } = require('./sendDownloadAppEmails')
const emailCachePath = './emailCache'

const NOTIFICATION_JOB_LAST_SUCCESS_KEY = 'notifications:last-success'
const NOTIFICATION_EMAILS_JOB_LAST_SUCCESS_KEY =
  'notifications:emails:last-success'
const NOTIFICATION_ANNOUNCEMENTS_JOB_LAST_SUCCESS_KEY =
  'notifications:announcements:last-success'
const NOTIFICATION_DOWNLOAD_EMAIL_JOB_LAST_SUCCESS_KEY =
  'notifications:download-emails:last-success'
const downloadEmailJobType = 'downloadEmailJobType'

// Reference Bull Docs: https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queue
const defaultJobOptions = {
  removeOnComplete: true,
  removeOnFail: true
}

class NotificationProcessor {
  constructor({ errorHandler }) {
    this.downloadEmailQueue = new Bull(`download-email-queue-${Date.now()}`, {
      redis: {
        port: config.get('redisPort'),
        host: config.get('redisHost')
      },
      defaultJobOptions
    })
    if (errorHandler) {
      this.errorHandler = errorHandler
    } else {
      this.errorHandler = () => null
    }
  }

  /**
   * Initialize notification and milestone processing
   * 1. Clear the notifQueue and emailQueue
   * 2. Update all blockchainId's in the users table where blockchainId is null
   * 3. Process notif queue and recursively add notif job on queue after 3 seconds
   *    Process email queue and recursively add email job on queue after 3 seconds
   * @param {Object} audiusLibs libs instance
   * @param {Object} expressApp express app context
   * @param {Object} redis redis connection
   */
  async init(audiusLibs, expressApp, redis) {
    // Clear any pending notif jobs
    await this.downloadEmailQueue.empty()
    this.redis = redis
    this.mg = expressApp.get('sendgrid')

    // Index all blockchain ids
    this.idUpdateTask = updateBlockchainIds()

    // Download Email notification queue
    this.downloadEmailQueue.process(async (job) => {
      logger.debug('processDownloadEmails')
      let error = null
      try {
        await processDownloadAppEmail(expressApp, audiusLibs)
        await this.redis.set(
          NOTIFICATION_DOWNLOAD_EMAIL_JOB_LAST_SUCCESS_KEY,
          new Date().toISOString()
        )
      } catch (e) {
        error = e
        logger.error(
          `processDownloadEmails - Problem with processing emails: ${e}`
        )
        this.errorHandler(e)
      }
      await this.downloadEmailQueue.add(
        { type: downloadEmailJobType },
        { jobId: `${downloadEmailJobType}:${Date.now()}` }
      )
    })

    // Add initial jobs to the queue
    if (!fs.existsSync(emailCachePath)) {
      fs.mkdirSync(emailCachePath)
    }
    await this.downloadEmailQueue.add(
      { type: downloadEmailJobType },
      { jobId: `${downloadEmailJobType}:${Date.now()}` }
    )
  }
}

module.exports = NotificationProcessor
module.exports.NOTIFICATION_JOB_LAST_SUCCESS_KEY =
  NOTIFICATION_JOB_LAST_SUCCESS_KEY
module.exports.NOTIFICATION_EMAILS_JOB_LAST_SUCCESS_KEY =
  NOTIFICATION_EMAILS_JOB_LAST_SUCCESS_KEY
module.exports.NOTIFICATION_ANNOUNCEMENTS_JOB_LAST_SUCCESS_KEY =
  NOTIFICATION_ANNOUNCEMENTS_JOB_LAST_SUCCESS_KEY
module.exports.NOTIFICATION_DOWNLOAD_EMAIL_JOB_LAST_SUCCESS_KEY =
  NOTIFICATION_DOWNLOAD_EMAIL_JOB_LAST_SUCCESS_KEY
