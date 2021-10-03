const Bull = require('bull')
const config = require('../config.js')
const models = require('../models')
const fs = require('fs')
const { logger } = require('../logging')
const { indexMilestones } = require('./milestoneProcessing')
const {
  updateBlockchainIds,
  // calculateTrackListenMilestones,
  calculateTrackListenMilestonesFromDiscovery,
  getHighestBlockNumber,
  getHighestSlot
} = require('./utils')
const { processEmailNotifications } = require('./sendNotificationEmails')
const { processDownloadAppEmail } = require('./sendDownloadAppEmails')
const { pushAnnouncementNotifications } = require('./pushAnnouncementNotifications')
const { notificationJobType, solanaNotificationJobType, announcementJobType, unreadEmailJobType } = require('./constants')
const { drainPublishedMessages, drainPublishedSolanaMessages } = require('./notificationQueue')
const emailCachePath = './emailCache'
const processNotifications = require('./processNotifications/index.js')
const { indexTrendingTracks } = require('./trendingTrackProcessing')
const sendNotifications = require('./sendNotifications/index.js')
const audiusLibsWrapper = require('../audiusLibsInstance')

const NOTIFICATION_INTERVAL_SEC = 3 * 1000
const NOTIFICATION_SOLANA_INTERVAL_SEC = 3 * 1000
const NOTIFICATION_EMAILS_INTERVAL_SEC = 10 * 60 * 1000
const NOTIFICATION_ANNOUNCEMENTS_INTERVAL_SEC = 30 * 1000

const NOTIFICATION_JOB_LAST_SUCCESS_KEY = 'notifications:last-success'
const NOTIFICATION_SOLANA_JOB_LAST_SUCCESS_KEY = 'notifications:solana:last-success'
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
    this.solanaNotifQueue = new Bull(
      `solana-notification-queue-${Date.now()}`,
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
          const optimizelyClient = expressApp.get('optimizelyClient')
          maxBlockNumber = await this.indexAll(audiusLibs, optimizelyClient, minBlock, oldMaxBlockNumber)
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

    // Solana notification processing job
    // Indexes solana notifications
    this.solanaNotifQueue.process(async (job, done) => {
      let error = null

      let minSlot = job.data.minSlot
      if (!minSlot && minSlot !== 0) throw new Error('no min slot')

      try {
        const oldMaxSlot = await this.redis.get('maxSlot')
        let maxSlot = null

        // Index notifications
        if (minSlot < oldMaxSlot) {
          logger.debug('notification queue processing error - tried to process a minSlot < oldMaxSlot', minSlot, oldMaxSlot)
          maxSlot = oldMaxSlot
        } else {
          maxSlot = await this.indexAllSolanaNotifications(audiusLibs, minSlot, oldMaxSlot)
        }

        // Update cached max slot number
        await this.redis.set('maxSlot', maxSlot)

        // Record success
        await this.redis.set(NOTIFICATION_SOLANA_JOB_LAST_SUCCESS_KEY, new Date().toISOString())

        // Restart job with updated starting slot
        await this.notifQueue.add({
          type: solanaNotificationJobType,
          minSlot: maxSlot
        }, {
          jobId: `${solanaNotificationJobType}:${Date.now()}`
        })
      } catch (e) {
        error = e
        logger.error(`Restarting due to error indexing notifications : ${e}`)
        this.errorHandler(e)
        // Restart job with same starting slot
        await this.notifQueue.add({
          type: solanaNotificationJobType,
          minSlot: minSlot
        }, {
          jobId: `${solanaNotificationJobType}:${Date.now()}`
        })
      }
      // Delay 3s
      await new Promise(resolve => setTimeout(resolve, NOTIFICATION_SOLANA_INTERVAL_SEC))

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
        logger.error(`processEmailNotifications - Problem with processing emails: ${e}`)
        this.errorHandler(e)
      }
      // Wait 10 minutes before re-running the job
      await new Promise(resolve => setTimeout(resolve, NOTIFICATION_EMAILS_INTERVAL_SEC))
      await this.emailQueue.add({ type: unreadEmailJobType }, { jobId: `${unreadEmailJobType}:${Date.now()}` })
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
    logger.info(`Starting with block ${startBlock}`)
    await this.notifQueue.add({
      minBlock: startBlock,
      type: notificationJobType
    }, {
      jobId: `${notificationJobType}:${Date.now()}`
    })

    let startSlot = await getHighestSlot()
    logger.info(`Starting with slot ${startSlot}`)
    await this.solanaNotifQueue.add({
      minSlot: startSlot,
      type: solanaNotificationJobType
    }, {
      jobId: `${solanaNotificationJobType}:${Date.now()}`
    })

    await this.emailQueue.add({ type: unreadEmailJobType }, { jobId: `${unreadEmailJobType}:${Date.now()}` })
    await this.announcementQueue.add({ type: announcementJobType }, { jobId: `${announcementJobType}:${Date.now()}` })
  }

  /**
   * 1. Get the total listens for the most reecently listened to tracks
   * 2. Query the discprov for new notifications starting at minBlock
   * 3. Combine owner object from discprov with track listen counts
   * 4. Process notifications
   * 5. Process milestones
   * @param {AudiusLibs} audiusLibs
   * @param {OptimizelyClient} optimizelyClient
   * @param {number} minBlock min start block to start querying discprov for new notifications
   * @param {number} oldMaxBlockNumber last max black number seen
   */
  async indexAll (audiusLibs, optimizelyClient, minBlock, oldMaxBlockNumber) {
    const startDate = Date.now()
    const startTime = process.hrtime()
    let time = startDate

    logger.info(`notifications main indexAll job - minBlock: ${minBlock}, oldMaxBlockNumber: ${oldMaxBlockNumber}, startDate: ${startDate}, startTime: ${new Date()}`)

    const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()

    // Query owners for tracks relevant to track listen counts
    // Below can be toggled once milestones are calculated in discovery
    // let listenCounts = await calculateTrackListenMilestones()
    const listenCounts = await calculateTrackListenMilestonesFromDiscovery(discoveryProvider)
    logger.info(`notifications main indexAll job - calculateTrackListenMilestonesFromDiscovery complete in ${Date.now() - time}ms`)
    time = Date.now()

    const trackIdOwnersToRequestList = listenCounts.map(x => x.trackId)

    // These track_id get parameters will be used to retrieve track owner info
    // This is required since there is no guarantee that there are indeed notifications for this user
    // The owner info is then used to target listenCount milestone notifications
    // Timeout of 2 minutes
    const timeout = 2 /* min */ * 60 /* sec */ * 1000 /* ms */
    const { info: metadata, notifications, owners, milestones } = await discoveryProvider.getNotifications(minBlock, trackIdOwnersToRequestList, timeout)
    logger.info(`notifications main indexAll job - query notifications from discovery node complete in ${Date.now() - time}ms`)
    time = Date.now()

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
      logger.info(`notifications main indexAll job - processNotifications complete in ${Date.now() - time}ms`)
      time = Date.now()

      // Fetch additional metadata from DP, query for the user's notification settings, and send push notifications (mobile/browser)
      await sendNotifications(audiusLibs, notifications, tx)
      logger.info(`notifications main indexAll job - sendNotifications complete in ${Date.now() - time}ms`)
      time = Date.now()

      await indexMilestones(milestones, owners, metadata, listenCountWithOwners, audiusLibs, tx)
      logger.info(`notifications main indexAll job - indexMilestones complete in ${Date.now() - time}ms`)
      time = Date.now()

      // Fetch trending track milestones
      await indexTrendingTracks(audiusLibs, optimizelyClient, tx)
      logger.info(`notifications main indexAll job - indexTrendingTracks complete in ${Date.now() - time}ms`)
      time = Date.now()

      // Commit
      await tx.commit()

      // actually send out push notifications
      await drainPublishedMessages()
      logger.info(`notifications main indexAll job - drainPublishedMessages complete in ${Date.now() - time}ms`)

      const endTime = process.hrtime(startTime)
      const duration = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6)
      logger.info(`notifications main indexAll job finished - minBlock: ${minBlock}, startDate: ${startDate}, duration: ${duration}, notifications: ${notifications.length}`)
    } catch (e) {
      logger.error(`Error indexing notification in ${Date.now() - startDate}ms ${e}`)
      logger.error(e.stack)
      await tx.rollback()
    }
    return metadata.max_block_number
  }

  /**
   * Doing the solana notification things
   * @param {AudiusLibs} audiusLibs
   * @param {number} minSlot min slot number to start querying discprov for new notifications
   * @param {number} oldMaxSlot last max slot number seen
   */
  async indexAllSolanaNotifications (audiusLibs, minSlot, oldMaxSlot) {
    const startDate = Date.now()
    const startTime = process.hrtime()
    const logLabel = 'notifications main indexAllSolanaNotifications job'

    logger.info(`${logLabel} - minSlot: ${minSlot}, oldMaxSlot: ${oldMaxSlot}, startDate: ${startDate}, startTime: ${startTime}`)

    // const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()
    const { discoveryProvider } = audiusLibs

    // Timeout of 2 minutes
    const timeout = 2 /* min */ * 60 /* sec */ * 1000 /* ms */
    const { info: metadata, notifications } = await discoveryProvider.getSolanaNotifications(minSlot, timeout)
    logger.info(`${logLabel} - query solana notifications from discovery node complete`)

    // Use a single transaction
    const tx = await models.sequelize.transaction()
    try {
      // Insert the solana notifications into the DB
      await processNotifications(notifications, tx)
      logger.info(`${logLabel} - processNotifications complete`)

      // Fetch additional metadata from DP, query for the user's notification settings, and send push notifications (mobile/browser)
      await sendNotifications(audiusLibs, notifications, tx)
      logger.info(`${logLabel} - sendNotifications complete`)

      // Commit
      await tx.commit()

      // actually send out push notifications
      await drainPublishedSolanaMessages()
      logger.info(`${logLabel} - drainPublishedMessages complete`)

      const endTime = process.hrtime(startTime)
      const duration = Math.round(endTime[0] * 1e3 + endTime[1] * 1e-6)
      logger.info(`${logLabel} finished - minSlot: ${minSlot}, startDate: ${startDate}, duration: ${duration}, notifications: ${notifications.length}`)
    } catch (e) {
      logger.error(`Error indexing notification ${e}`)
      logger.error(e.stack)
      await tx.rollback()
    }

    return metadata.max_slot_number
  }
}

module.exports = NotificationProcessor
module.exports.NOTIFICATION_JOB_LAST_SUCCESS_KEY = NOTIFICATION_JOB_LAST_SUCCESS_KEY
module.exports.NOTIFICATION_EMAILS_JOB_LAST_SUCCESS_KEY = NOTIFICATION_EMAILS_JOB_LAST_SUCCESS_KEY
module.exports.NOTIFICATION_ANNOUNCEMENTS_JOB_LAST_SUCCESS_KEY = NOTIFICATION_ANNOUNCEMENTS_JOB_LAST_SUCCESS_KEY
