const { logger } = require('../../logging')
const { notificationTypes } = require('../constants')

const processFollowNotifications = require('./followNotification')
const processRepostNotifications = require('./repostNotification')
const processFavoriteNotifications = require('./favoriteNotification')
const processRemixCreateNotifications = require('./remixCreateNotification')
const processRemixCosignNotifications = require('./remixCosignNotification')
const processCreateNotifications = require('./createNotification')

const notifcationMapping = {
  [notificationTypes.Follow]: processFollowNotifications,
  [notificationTypes.Repost.base]: processRepostNotifications,
  [notificationTypes.Favorite.base]: processFavoriteNotifications,
  [notificationTypes.RemixCreate]: processRemixCreateNotifications,
  [notificationTypes.RemixCosign]: processRemixCosignNotifications,
  [notificationTypes.Create.base]: processCreateNotifications,
}

async function processNotifications (notifications, tx) {
  const notificationCategories  = notifications.reduce((categories, notification) => {
    if (!categories[notification.type]) {
      categories[notification.type] = []
    }
    categories[notification.type].push(notification)
    return categories
  }, {})

  for (const notifType in notificationCategories) {
    if (notifType in notifcationMapping) {
      const notifications = notificationCategories[notifType]
      const processType = notifcationMapping[notifType]
      await processType(notifications, tx)
    }
  }
}

module.exports = processNotifications
