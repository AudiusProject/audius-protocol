const { logger } = require('../../logging')
const { notificationTypes } = require('../constants')

const processFollowNotifications = require('./followNotification')
const processRepostNotifications = require('./repostNotification')
const processFavoriteNotifications = require('./favoriteNotification')
const processRemixCreateNotifications = require('./remixCreateNotification')
const processRemixCosignNotifications = require('./remixCosignNotification')
const processCreateNotifications = require('./createNotification')
const processPlaylistUpdateNotifications = require('./playlistUpdateNotification')

// Mapping of Notification type to processing function.
const notificationMapping = {
  [notificationTypes.Follow]: processFollowNotifications,
  [notificationTypes.Repost.base]: processRepostNotifications,
  [notificationTypes.Favorite.base]: processFavoriteNotifications,
  [notificationTypes.RemixCreate]: processRemixCreateNotifications,
  [notificationTypes.RemixCosign]: processRemixCosignNotifications,
  [notificationTypes.Create.base]: processCreateNotifications,
  [notificationTypes.PlaylistUpdate]: processPlaylistUpdateNotifications
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

  // Loop through each notification type and batch process
  for (const notifType in notificationCategories) {
    if (notifType in notificationMapping) {
      const notifications = notificationCategories[notifType]
      const processType = notificationMapping[notifType]
      logger.debug(`Processing: ${notifications.length} notifications of type ${notifType}`)
      await processType(notifications, tx)
    }
  }
}

module.exports = processNotifications
