const { logger } = require('../../logging')
const { notificationTypes } = require('../constants')

const processFollowNotifications = require('./followNotification')
const processRepostNotifications = require('./repostNotification')
const processFavoriteNotifications = require('./favoriteNotification')
const processRemixCreateNotifications = require('./remixCreateNotification')
const processRemixCosignNotifications = require('./remixCosignNotification')
const processCreateNotifications = require('./createNotification')
const processPlaylistUpdateNotifications = require('./playlistUpdateNotification')
const processChallengeRewardNotifications = require('./challengeRewardNotification')
const processMilestoneListenNotifications = require('./milestoneListenNotification')

// Mapping of Notification type to processing function.
const notificationMapping = {
  [notificationTypes.Follow]: processFollowNotifications,
  [notificationTypes.Repost.base]: processRepostNotifications,
  [notificationTypes.Favorite.base]: processFavoriteNotifications,
  [notificationTypes.RemixCreate]: processRemixCreateNotifications,
  [notificationTypes.RemixCosign]: processRemixCosignNotifications,
  [notificationTypes.Create.base]: processCreateNotifications,
  [notificationTypes.PlaylistUpdate]: processPlaylistUpdateNotifications,
  [notificationTypes.ChallengeReward]: processChallengeRewardNotifications,
  [notificationTypes.MilestoneListen]: processMilestoneListenNotifications
}

/**
 * Write notifications into the DB. Group the notifications by type to be batch processed together
 * @param {Array<Object>} notifications Array of notifications from DP
 * @param {*} tx The transaction to add to each of the DB lookups/inserts/deletes
 */

async function processNotifications (notifications, tx) {
  // Group the notifications by type
  const notificationCategories = notifications.reduce((categories, notification) => {
    if (!categories[notification.type]) {
      categories[notification.type] = []
    }
    categories[notification.type].push(notification)
    return categories
  }, {})

  // Process notification types in parallel
  const processedNotifications = await Promise.all(Object.entries(notificationCategories).map(([notifType, notifications]) => {
    const processType = notificationMapping[notifType]
    if (processType) {
      logger.debug(`Processing: ${notifications.length} notifications of type ${notifType}`)
      return processType(notifications, tx)
    } else {
      logger.error('processNotifications - no handler defined for notification type', notifType)
      return []
    }
  }))
  return processedNotifications.flat()
}

module.exports = processNotifications
