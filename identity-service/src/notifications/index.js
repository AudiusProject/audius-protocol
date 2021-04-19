const Bull = require('bull')
const config = require('../config.js')
const models = require('../models')
const axios = require('axios')
const fs = require('fs')
const { logger } = require('../logging')
const { indexMilestones } = require('./milestoneProcessing')
const {
  updateBlockchainIds,
  calculateTrackListenMilestones,
  calculateTrackListenMilestonesFromDiscovery,
  getHighestBlockNumber
} = require('./utils')
const { processEmailNotifications } = require('./sendNotificationEmails')
const { processDownloadAppEmail } = require('./sendDownloadAppEmails')
const { pushAnnouncementNotifications } = require('./pushAnnouncementNotifications')
const { notificationJobType, announcementJobType } = require('./constants')
const { drainPublishedMessages } = require('./notificationQueue')
const emailCachePath = './emailCache'
const processNotifications = require('./processNotifications/index.js')
const { indexTrendingTracks } = require('./trendingTrackProcessing')
const sendNotifications = require('./sendNotifications/index.js')
const audiusLibsWrapper = require('../audiusLibsInstance')

const NOTIFICATION_INTERVAL_SEC = 3 * 1000
const NOTIFICATION_EMAILS_INTERVAL_SEC = 10 * 60 * 1000
const NOTIFICATION_ANNOUNCEMENTS_INTERVAL_SEC = 30 * 1000

const NOTIFICATION_JOB_LAST_SUCCESS_KEY = 'notifications:last-success'
const NOTIFICATION_EMAILS_JOB_LAST_SUCCESS_KEY = 'notifications:emails:last-success'
const NOTIFICATION_ANNOUNCEMENTS_JOB_LAST_SUCCESS_KEY = 'notifications:announcements:last-success'

// Reference Bull Docs: https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queue
const defaultJobOptions = {
  removeOnComplete: true,
  removeOnFail: true
}

class NotificationProcessor {
  constructor ({
    errorHandler
  }) {
    this.notifQueue = new Bull(
      `notification-queue-${Date.now()}`,
      {
        redis: {
          port: config.get('redisPort'),
          host: config.get('redisHost')
        },
        defaultJobOptions
      })
    this.emailQueue = new Bull(
      `email-queue-${Date.now()}`,
      {
        redis: {
          port: config.get('redisPort'),
          host: config.get('redisHost')
        },
        defaultJobOptions
      })
    this.announcementQueue = new Bull(
      `announcement-queue-${Date.now()}`,
      {
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
  async init (audiusLibs, expressApp, redis) {
    // Clear any pending notif jobs
    await this.notifQueue.empty()
    await this.emailQueue.empty()
    this.redis = redis
    this.mg = expressApp.get('mailgun')

    // Index all blockchain ids
    this.idUpdateTask = updateBlockchainIds()

    // Notification processing job
    // Indexes network notifications
    this.notifQueue.process(async (job, done) => {
      let error = null

      let minBlock = job.data.minBlock
      if (!minBlock && minBlock !== 0) throw new Error('no min block')

      // Re-enable for development as needed
      // this.emailQueue.add({ type: 'unreadEmailJob' })

      try {
        const oldMaxBlockNumber = await this.redis.get('maxBlockNumber')
        let maxBlockNumber = null
        // Index notifications and milestones
        if (minBlock < oldMaxBlockNumber) {
          logger.debug('notification queue processing error - tried to process a minBlock < oldMaxBlockNumber', minBlock, oldMaxBlockNumber)
          maxBlockNumber = oldMaxBlockNumber
        } else {
          maxBlockNumber = await this.indexAll(audiusLibs, minBlock, oldMaxBlockNumber)
        }

        // Update cached max block number
        await this.redis.set('maxBlockNumber', maxBlockNumber)

        // Record success
        await this.redis.set(NOTIFICATION_JOB_LAST_SUCCESS_KEY, new Date().toISOString())

        // Restart job with updated startBlock
        await this.notifQueue.add({
          type: notificationJobType,
          minBlock: maxBlockNumber
        }, {
          jobId: `${notificationJobType}:${Date.now()}`
        })
      } catch (e) {
        error = e
        logger.error(`Restarting due to error indexing notifications : ${e}`)
        this.errorHandler(e)
        // Restart job with same startBlock
        await this.notifQueue.add({
          type: notificationJobType,
          minBlock: minBlock
        }, {
          jobId: `${notificationJobType}:${Date.now()}`
        })
      }
      // Delay 3s
      await new Promise(resolve => setTimeout(resolve, NOTIFICATION_INTERVAL_SEC))

      done(error)
    })

    // Email notification queue
    this.emailQueue.process(async (job, done) => {
      logger.info('processEmailNotifications')
      let error = null
      try {
        await processEmailNotifications(expressApp, audiusLibs)
        await processDownloadAppEmail(expressApp, audiusLibs)
        await this.redis.set(NOTIFICATION_EMAILS_JOB_LAST_SUCCESS_KEY, new Date().toISOString())
      } catch (e) {
        error = e
        logger.error(`processEmailNotifications - Problem with processing a emails: ${e}`)
        this.errorHandler(e)
      }
      // Wait 10 minutes before re-running the job
      await new Promise(resolve => setTimeout(resolve, NOTIFICATION_EMAILS_INTERVAL_SEC))
      await this.emailQueue.add({ type: 'unreadEmailJob' }, { jobId: `unreadEmailJob:${Date.now()}` })
      done(error)
    })

    // Announcement push notifications queue
    this.announcementQueue.process(async (job, done) => {
      logger.info('pushAnnouncementNotifications')
      let error = null
      try {
        await pushAnnouncementNotifications()
        await this.redis.set(NOTIFICATION_ANNOUNCEMENTS_JOB_LAST_SUCCESS_KEY, new Date().toISOString())
      } catch (e) {
        error = e
        logger.error(`pushAnnouncementNotifications - Problem with processing announcements: ${e}`)
        this.errorHandler(e)
      }
      // Delay 30s
      await new Promise(resolve => setTimeout(resolve, NOTIFICATION_ANNOUNCEMENTS_INTERVAL_SEC))
      await this.announcementQueue.add({ type: announcementJobType }, { jobId: `${announcementJobType}:${Date.now()}` })
      done(error)
    })

    // Add initial jobs to the queue
    if (!fs.existsSync(emailCachePath)) {
      fs.mkdirSync(emailCachePath)
    }

    let startBlock = await getHighestBlockNumber()
    logger.info(`Starting with ${startBlock}`)
    await this.notifQueue.add({
      minBlock: startBlock,
      type: notificationJobType
    }, {
      jobId: `${notificationJobType}:${Date.now()}`
    })

    await this.emailQueue.add({ type: 'unreadEmailJob' }, { jobId: Date.now() })
    await this.announcementQueue.add({ type: announcementJobType }, { jobId: `${announcementJobType}:${Date.now()}` })
  }

  /**
   * 1. Get the total listens for the most reecently listened to tracks
   * 2. Query the discprov for new notifications starting at minBlock
   * 3. Combine owner object from discprov with track listen counts
   * 4. Process notifications
   * 5. Process milestones
   * @param {Integer} minBlock min start block to start querying discprov for new notifications
   */
  async indexAll (audiusLibs, minBlock, oldMaxBlockNumber) {
    const startDate = Date.now()
    const startTime = process.hrtime()

    logger.info({ minBlock, oldMaxBlockNumber, startDate }, `${new Date()} - notifications main indexAll job`)

    const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()

    // Query owners for tracks relevant to track listen counts
    // Below can be toggled once milestones are calculated in discovery
    // let listenCounts = await calculateTrackListenMilestones()
    let listenCounts = await calculateTrackListenMilestonesFromDiscovery(discoveryProvider)

    let trackIdOwnersToRequestList = listenCounts.map(x => x.trackId)

    // These track_id get parameters will be used to retrieve track owner info
    // This is required since there is no guarantee that there are indeed notifications for this user
    // The owner info is then used to target listenCount milestone notifications
    let params = new URLSearchParams()
    trackIdOwnersToRequestList.forEach((x) => { params.append('track_id', x) })
    params.append('min_block_number', minBlock)

    let reqObj = {
      method: 'get',
      url: `${discoveryProvider.discoveryProviderEndpoint}/notifications`,
      params,
      timeout: 120000 // two minutes
    }

    let body = (await axios(reqObj)).data
    let metadata = body.data.info
    let notifications = body.data.notifications
    let milestones = body.data.milestones
    let owners = body.data.owners

    // Use a single transaction
    const tx = await models.sequelize.transaction()
    try {
      // Populate owners, used to index in milestone generation
      const listenCountWithOwners = listenCounts.map((x) => {
        return {
          trackId: x.trackId,
          listenCount: x.listenCount,
          owner: owners.tracks[x.trackId]
        }
      })

      // Insert the notifications into the DB to make it easy for users to query for their grouped notifications
      await processNotifications(notifications, tx)

      // Fetch additional metadata from DP, query for the user's notification settings, and send push notifications (mobile/browser)
      await sendNotifications(audiusLibs, notifications, tx)

      await indexMilestones(milestones, owners, metadata, listenCountWithOwners, audiusLibs, tx)

      // Fetch trending track milestones
      await indexTrendingTracks(audiusLibs, tx)

      // Commit
      await tx.commit()

      // actually send out push notifications
      await drainPublishedMessages()

      const endTime = process.hrtime(startTime)
      const duration = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6)
      logger.info({ minBlock, startDate, duration, notifications: notifications.length }, `indexAll - finished main notification index job`)
    } catch (e) {
      logger.error(`Error indexing notification ${e}`)
      logger.error(e.stack)
      await tx.rollback()
    }
    return metadata.max_block_number
  }
}

module.exports = NotificationProcessor
module.exports.NOTIFICATION_JOB_LAST_SUCCESS_KEY = NOTIFICATION_JOB_LAST_SUCCESS_KEY
module.exports.NOTIFICATION_EMAILS_JOB_LAST_SUCCESS_KEY = NOTIFICATION_EMAILS_JOB_LAST_SUCCESS_KEY
module.exports.NOTIFICATION_ANNOUNCEMENTS_JOB_LAST_SUCCESS_KEY = NOTIFICATION_ANNOUNCEMENTS_JOB_LAST_SUCCESS_KEY
