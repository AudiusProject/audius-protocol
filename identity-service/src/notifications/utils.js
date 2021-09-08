const axios = require('axios')
const models = require('../models')
const config = require('../config')
const Hashids = require('hashids/cjs')
const { logger } = require('../logging')
const audiusLibsWrapper = require('../audiusLibsInstance')

// default configs
const startBlock = config.get('notificationStartBlock')
// Number of tracks to fetch for new listens on each poll
const trackListenMilestonePollCount = 100

/**
 * For any users missing blockchain id, here we query the values from discprov and fill them in
 */
async function updateBlockchainIds () {
  const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()

  let usersWithoutBlockchainId = await models.User.findAll({
    attributes: ['walletAddress', 'handle'],
    where: { blockchainUserId: null }
  })
  for (let updateUser of usersWithoutBlockchainId) {
    try {
      let walletAddress = updateUser.walletAddress
      logger.info(`Updating user with wallet ${walletAddress}`)
      const response = await axios({
        method: 'get',
        url: `${discoveryProvider.discoveryProviderEndpoint}/users`,
        params: {
          wallet: walletAddress
        }
      })
      if (response.data.data.length === 1) {
        let respUser = response.data.data[0]
        let missingUserId = respUser.user_id
        let missingHandle = respUser.handle
        let updateObject = { blockchainUserId: missingUserId }

        if (updateUser.handle === null) {
          updateObject['handle'] = missingHandle
        }
        await models.User.update(
          updateObject,
          { where: { walletAddress } }
        )
        logger.info(`Updated wallet ${walletAddress} to blockchainUserId: ${missingUserId}, ${updateUser.handle}`)
        continue
      }
      for (let respUser of response.data.data) {
        // Only update if handles match
        if (respUser.handle === updateUser.handle) {
          let missingUserId = respUser.user_id
          await models.User.update(
            { blockchainUserId: missingUserId },
            { where: { walletAddress, handle: updateUser.handle } }
          )
          logger.info(`Updated wallet ${walletAddress} to blockchainUserId: ${missingUserId}, ${updateUser.handle}`)
          await models.UserNotificationSettings.findOrCreate({ where: { userId: missingUserId } })
        }
      }
    } catch (e) {
      logger.error('Error in updateBlockchainIds', e)
    }
  }
}

/**
 * Queries the discovery provider and returns n most listened to tracks, with the
 * total listen count for each of those tracks
 * This includes track listens writen to Solana
 *
 * @returns Array [{trackId, listenCount}, trackId, listenCount]
 */
async function calculateTrackListenMilestonesFromDiscovery (discoveryProvider) {
  // Pull listen count notification data from discovery provider
  const timeout = 2 /* min */ * 60 /* sec */ * 10000 /* ms */
  const trackListenMilestones = await discoveryProvider.getTrackListenMilestones(timeout)
  const listenCountBody = trackListenMilestones.data
  let parsedListenCounts = []
  for (let key in listenCountBody) {
    parsedListenCounts.push({
      trackId: key,
      listenCount: listenCountBody[key]
    })
  }
  return parsedListenCounts
}

/**
 * For the n most recently listened to tracks, return the all time listen counts for those tracks
 * where n is `trackListenMilestonePollCount
 *
 * @returns Array [{trackId, listenCount}, trackId, listenCount}]
 */
async function calculateTrackListenMilestones () {
  let recentListenCountQuery = {
    attributes: [[models.Sequelize.col('trackId'), 'trackId'],
      [models.Sequelize.fn('max', models.Sequelize.col('hour')), 'hour']],
    order: [[models.Sequelize.col('hour'), 'DESC']],
    group: ['trackId'],
    limit: trackListenMilestonePollCount
  }

  // Distinct tracks
  let res = await models.TrackListenCount.findAll(recentListenCountQuery)
  let tracksListenedTo = res.map((listenEntry) => listenEntry.trackId)

  // Total listens query
  let totalListens = {
    attributes: [
      [models.Sequelize.col('trackId'), 'trackId'],
      [
        models.Sequelize.fn('date_trunc', 'millennium', models.Sequelize.col('hour')),
        'date'
      ],
      [models.Sequelize.fn('sum', models.Sequelize.col('listens')), 'listens']
    ],
    group: ['trackId', 'date'],
    order: [[models.Sequelize.col('listens'), 'DESC']],
    where: {
      trackId: { [models.Sequelize.Op.in]: tracksListenedTo }
    }
  }

  // Map of listens
  let totalListenQuery = await models.TrackListenCount.findAll(totalListens)
  let processedTotalListens = totalListenQuery.map((x) => {
    return { trackId: x.trackId, listenCount: x.listens }
  })

  return processedTotalListens
}

/**
 * Get max block from the NotificationAction table
 * @returns Integer highestBlockNumber
 */
async function getHighestBlockNumber () {
  let highestBlockNumber = await models.NotificationAction.max('blocknumber')
  if (!highestBlockNumber) {
    highestBlockNumber = startBlock
  }
  let date = new Date()
  logger.info(`Highest block: ${highestBlockNumber} - ${date}`)
  return highestBlockNumber
}

/**
 * Checks the user notification settings for both regular and push notifications and
 * returns if they should be notified according to their settings
 *
 * @param {Integer} notificationTarget userId that we want to send a notification to
 * @param {String} prop property name in the settings object
 * @param {Object} tx sequelize tx (optional)
 * @returns Object { notifyWeb: Boolean, notifyMobile: Boolean}
 */
async function shouldNotifyUser (notificationTarget, prop, tx = null) {
  // mobile
  let mobileQuery = { where: { userId: notificationTarget } }
  if (tx) mobileQuery.transaction = tx
  let userNotifSettingsMobile = await models.UserNotificationMobileSettings.findOne(mobileQuery)
  const notifyMobile = (userNotifSettingsMobile && userNotifSettingsMobile[prop]) || false

  // browser push notifications
  let browserPushQuery = { where: { userId: notificationTarget } }
  if (tx) browserPushQuery.transaction = tx
  let userNotifBrowserPushSettings = await models.UserNotificationBrowserSettings.findOne(browserPushQuery)
  const notifyBrowserPush = (userNotifBrowserPushSettings && userNotifBrowserPushSettings[prop]) || false

  return { notifyMobile, notifyBrowserPush }
}

/* We use a JS implementation of the the HashIds protocol (http://hashids.org)
 * to obfuscate our monotonically increasing int IDs as
 * strings in our consumable API.
 *
 * Discovery provider uses a python implementation of the same protocol
 * to encode and decode IDs.
 */
const HASH_SALT = 'azowernasdfoia'
const MIN_LENGTH = 5
const hashids = new Hashids(HASH_SALT, MIN_LENGTH)

/** Encodes an int ID into a string. */
function encodeHashId (id) {
  return hashids.encode([id])
}

/** Decodes a string id into an int. Returns null if an invalid ID. */
function decodeHashId (id) {
  const ids = hashids.decode(id)
  if (!ids.length) return null
  return ids[0]
}

const NOTIFICATIONS_POD_HOSTNAME = 'notifications-pod-hostname'
async function getShouldRunNotifications (redis) {
  const notificationsPodHostname = await redis.get(NOTIFICATIONS_POD_HOSTNAME)
  return config.HOSTNAME === notificationsPodHostname
}

module.exports = {
  encodeHashId,
  decodeHashId,
  updateBlockchainIds,
  calculateTrackListenMilestones,
  calculateTrackListenMilestonesFromDiscovery,
  getHighestBlockNumber,
  shouldNotifyUser,
  getShouldRunNotifications
}
