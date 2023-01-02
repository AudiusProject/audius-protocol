const axios = require('axios')
const moment = require('moment-timezone')
const Hashids = require('hashids/cjs')

const { dayInHours, weekInHours } = require('./constants')
const models = require('../models')
const config = require('../config')
const { logger } = require('../logging')
const audiusLibsWrapper = require('../audiusLibsInstance')
const { getFeatureFlag, FEATURE_FLAGS } = require('../featureFlag')

// default configs
const startBlock = config.get('notificationStartBlock')
const startSlot = config.get('solanaNotificationStartSlot')
// Number of tracks to fetch for new listens on each poll
const trackListenMilestonePollCount = 100

/**
 * For any users missing blockchain id, here we query the values from discprov and fill them in
 */
async function updateBlockchainIds() {
  const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()

  const usersWithoutBlockchainId = await models.User.findAll({
    attributes: ['walletAddress', 'handle'],
    where: { blockchainUserId: null }
  })
  for (const updateUser of usersWithoutBlockchainId) {
    try {
      const walletAddress = updateUser.walletAddress
      logger.info(`Updating user with wallet ${walletAddress}`)
      const response = await axios({
        method: 'get',
        url: `${discoveryProvider.discoveryProviderEndpoint}/users`,
        params: {
          wallet: walletAddress
        }
      })
      if (response.data.data.length === 1) {
        const respUser = response.data.data[0]
        const missingUserId = respUser.user_id
        const missingHandle = respUser.handle
        const updateObject = { blockchainUserId: missingUserId }

        if (updateUser.handle === null) {
          updateObject.handle = missingHandle
        }
        await models.User.update(updateObject, { where: { walletAddress } })
        logger.info(
          `Updated wallet ${walletAddress} to blockchainUserId: ${missingUserId}, ${updateUser.handle}`
        )
        continue
      }
      for (const respUser of response.data.data) {
        // Only update if handles match
        if (respUser.handle === updateUser.handle) {
          const missingUserId = respUser.user_id
          await models.User.update(
            { blockchainUserId: missingUserId },
            { where: { walletAddress, handle: updateUser.handle } }
          )
          logger.info(
            `Updated wallet ${walletAddress} to blockchainUserId: ${missingUserId}, ${updateUser.handle}`
          )
          const userSettings = await models.UserNotificationSettings.findOne({
            where: { userId: missingUserId }
          })
          if (userSettings == null) {
            await models.UserNotificationSettings.create({
              userId: missingUserId
            })
          }
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
async function calculateTrackListenMilestonesFromDiscovery(discoveryProvider) {
  // Pull listen count notification data from discovery provider
  const timeout = 2 /* min */ * 60 /* sec */ * 1000 /* ms */
  const trackListenMilestones =
    await discoveryProvider.getTrackListenMilestones(timeout)
  const listenCountBody = trackListenMilestones.data
  const parsedListenCounts = []
  for (const key in listenCountBody) {
    parsedListenCounts.push({
      trackId: key,
      listenCount: listenCountBody[key]
    })
  }
  return parsedListenCounts
}

/**
 * Queries the discovery provider and returns all subscribers for each user in
 * userIds.
 *
 * @param {Set<number>} userIds to fetch subscribers for
 * @returns Object {userId: Array[subscriberIds]}
 */
async function bulkGetSubscribersFromDiscovery(userIds) {
  const userSubscribersMap = {}
  if (userIds.size === 0) {
    return userSubscribersMap
  }

  try {
    const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()
    const ids = [...userIds].map((id) => encodeHashId(id))
    const response = await axios.post(
      `${discoveryProvider.discoveryProviderEndpoint}/v1/full/users/subscribers`,
      { ids: ids }
    )
    const userSubscribers = response.data.data
    userSubscribers.forEach((entry) => {
      const encodedUserId = entry.user_id
      const encodedSubscriberIds = entry.subscriber_ids
      const userId = decodeHashId(encodedUserId)
      const subscriberIds = encodedSubscriberIds.map((id) => decodeHashId(id))

      userSubscribersMap[userId] = subscriberIds
    })

    return userSubscribersMap
  } catch (e) {
    logger.error('Error when fetching subscribers from discovery', e)
    return {}
  }
}

/**
 * Checks whether to retrieve subscribers from discovery DB using
 * the READ_SUBSCRIBERS_FROM_DISCOVERY_ENABLED feature flag.
 *
 * @returns Boolean
 */
const shouldReadSubscribersFromDiscovery = (optimizelyClient) => {
  if (!optimizelyClient) {
    return false
  }
  return getFeatureFlag(
    optimizelyClient,
    FEATURE_FLAGS.READ_SUBSCRIBERS_FROM_DISCOVERY_ENABLED
  )
}

/**
 * For the n most recently listened to tracks, return the all time listen counts for those tracks
 * where n is `trackListenMilestonePollCount
 *
 * @returns Array [{trackId, listenCount}, trackId, listenCount}]
 */
async function calculateTrackListenMilestones() {
  const recentListenCountQuery = {
    attributes: [
      [models.Sequelize.col('trackId'), 'trackId'],
      [models.Sequelize.fn('max', models.Sequelize.col('hour')), 'hour']
    ],
    order: [[models.Sequelize.col('hour'), 'DESC']],
    group: ['trackId'],
    limit: trackListenMilestonePollCount
  }

  // Distinct tracks
  const res = await models.TrackListenCount.findAll(recentListenCountQuery)
  const tracksListenedTo = res.map((listenEntry) => listenEntry.trackId)

  // Total listens query
  const totalListens = {
    attributes: [
      [models.Sequelize.col('trackId'), 'trackId'],
      [
        models.Sequelize.fn(
          'date_trunc',
          'millennium',
          models.Sequelize.col('hour')
        ),
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
  const totalListenQuery = await models.TrackListenCount.findAll(totalListens)
  const processedTotalListens = totalListenQuery.map((x) => {
    return { trackId: x.trackId, listenCount: x.listens }
  })

  return processedTotalListens
}

/**
 * Get max block from the NotificationAction table
 * @returns Integer highestBlockNumber
 */
async function getHighestBlockNumber() {
  let highestBlockNumber = await models.NotificationAction.max('blocknumber')
  if (!highestBlockNumber) {
    highestBlockNumber = startBlock
  }
  const date = new Date()
  logger.info(`Highest block: ${highestBlockNumber} - ${date}`)
  return highestBlockNumber
}

/**
 * Get max slot from the SolanaNotificationAction table
 * @returns Integer highestSlot
 */
async function getHighestSlot() {
  let highestSlot = await models.SolanaNotificationAction.max('slot')
  if (!highestSlot) highestSlot = startSlot

  const date = new Date()
  logger.info(`Highest slot: ${highestSlot} - ${date}`)
  return highestSlot
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
async function shouldNotifyUser(notificationTarget, prop, tx = null) {
  // mobile
  const mobileQuery = { where: { userId: notificationTarget } }
  if (tx) mobileQuery.transaction = tx
  const userNotifSettingsMobile =
    await models.UserNotificationMobileSettings.findOne(mobileQuery)
  const notifyMobile =
    (userNotifSettingsMobile && userNotifSettingsMobile[prop]) || false

  // browser push notifications
  const browserPushQuery = { where: { userId: notificationTarget } }
  if (tx) browserPushQuery.transaction = tx
  const userNotifBrowserPushSettings =
    await models.UserNotificationBrowserSettings.findOne(browserPushQuery)
  const notifyBrowserPush =
    (userNotifBrowserPushSettings && userNotifBrowserPushSettings[prop]) ||
    false

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
function encodeHashId(id) {
  return hashids.encode([id])
}

/** Decodes a string id into an int. Returns null if an invalid ID. */
function decodeHashId(id) {
  const ids = hashids.decode(id)
  if (!ids.length) return null
  return ids[0]
}

const EmailFrequency = Object.freeze({
  OFF: 'off',
  LIVE: 'live',
  DAILY: 'daily',
  WEEKLY: 'weekly'
})

const MAX_HOUR_TIME_DIFFERENCE = 2

/**
 * Checks if the user should recieve an email base on notification settings and time
 * If setting is live then send email
 * If email was never sent to user then send email
 * If ~1 day has passed for daily frequency, or ~1 week has passed for weekly frequency then send email
 * @param {EmailFrequency} frequency live | daily | weekly
 * @param {moment} currentUtcTime moment datetime
 * @param {moment} lastSentTimestamp moment datetime
 * @param {number} hrsSinceStartOfDay
 * @returns boolean
 */
const shouldSendEmail = (
  frequency,
  currentUtcTime,
  lastSentTimestamp,
  hrsSinceStartOfDay
) => {
  if (frequency === EmailFrequency.OFF) return false
  if (frequency === EmailFrequency.LIVE) return true

  // If this is the first email, then it should render
  if (!lastSentTimestamp) return true

  const isValidFrequency = [
    EmailFrequency.DAILY,
    EmailFrequency.WEEKLY
  ].includes(frequency)
  const timeSinceEmail = moment
    .duration(currentUtcTime.diff(lastSentTimestamp))
    .asHours()
  const timeThreshold = (frequency === 'daily' ? dayInHours : weekInHours) - 1
  const hasValidTimeDifference = hrsSinceStartOfDay < MAX_HOUR_TIME_DIFFERENCE
  return (
    hasValidTimeDifference &&
    isValidFrequency &&
    timeSinceEmail >= timeThreshold
  )
}

const getSupporters = async (receiverUserId) => {
  const encodedReceiverId = encodeHashId(receiverUserId)
  const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()
  const url = `${discoveryProvider.discoveryProviderEndpoint}/v1/full/users/${encodedReceiverId}/supporters`

  try {
    const response = await axios({
      method: 'get',
      url
    })
    return response.data.data
  } catch (e) {
    console.error(`Error fetching supporters for user: ${receiverUserId}: ${e}`)
    return []
  }
}

module.exports = {
  encodeHashId,
  decodeHashId,
  updateBlockchainIds,
  calculateTrackListenMilestones,
  calculateTrackListenMilestonesFromDiscovery,
  bulkGetSubscribersFromDiscovery,
  getSupporters,
  shouldReadSubscribersFromDiscovery,
  getHighestBlockNumber,
  getHighestSlot,
  shouldNotifyUser,
  EmailFrequency,
  shouldSendEmail,
  MAX_HOUR_TIME_DIFFERENCE
}
