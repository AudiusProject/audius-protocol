const { logger } = require('../../logging')
const models = require('../../models')
const { deviceType, notificationTypes } = require('../constants')
const { fetchNotificationMetadata } = require('../fetchNotificationMetadata')
const {
  notificationResponseMap,
  notificationResponseTitleMap,
  pushNotificationMessagesMap
} = require('../formatNotificationMetadata')
const formatNotification = require('./formatNotification')
const { publish } = require('../notificationQueue')

function getUserIdsToNotify (notifications) {
  return notifications.reduce((userIds, notification) => {
    // Handle the 'follow' notification type
    if (notification.type === notificationTypes.Follow) {
      return userIds.concat(notification.metadata.followee_user_id)
    }

    // Handle the 'repost' notification type
    if (notification.type === notificationTypes.Repost.base) {
      return userIds.concat(notification.metadata.entity_owner_id)
    }

    // Handle the 'favorite' notification type, track/album/playlist
    if (notification.type === notificationTypes.Favorite.base) {
      return userIds.concat(notification.metadata.entity_owner_id)
    }

    // Handle the 'remix create' notification type
    if (notification.type === notificationTypes.RemixCreate) {
      return userIds.concat(notification.metadata.remix_parent_track_user_id)
    }
    return userIds
  }, [])
}

const getUserNotificationSettings = async (userIdsToNotify, tx) => {
  const userNotificationSettings = {}
  
  // mobile push notifications
  let mobileQuery = { where: { userId: { [models.Sequelize.Op.in]: userIdsToNotify } }, transaction: tx }
  let userNotifSettingsMobile = await models.UserNotificationMobileSettings.findAll(mobileQuery)
  userNotifSettingsMobile.forEach(settings => {
    userNotificationSettings[settings.userId] = { mobile: settings }
  })

  // browser push notifications
  let browserPushQuery = { where: { userId: { [models.Sequelize.Op.in]: userIdsToNotify } }, transaction: tx }
  let userNotifBrowserPushSettings = await models.UserNotificationBrowserSettings.findAll(browserPushQuery)
  userNotifBrowserPushSettings.forEach(settings => {
    userNotificationSettings[settings.userId] = { ...(userNotificationSettings[settings.userId] || {}), browser: settings }
  })
  return userNotificationSettings
} 

const getPublishNotifBaseType = (notification) => {
  switch (notification.type) {
    case notificationTypes.Follow:
      return notificationTypes.Follow
    case notificationTypes.Repost.track:
    case notificationTypes.Repost.playlist:
    case notificationTypes.Repost.album:
    case notificationTypes.Repost.base:
      return notificationTypes.Repost.base
    case notificationTypes.Favorite.track:
    case notificationTypes.Favorite.playlist:
    case notificationTypes.Favorite.album:
    case notificationTypes.Favorite.base:
      return notificationTypes.Favorite.base
    case notificationTypes.RemixCreate:
      return notificationTypes.RemixCreate
    case notificationTypes.RemixCosign:
      return notificationTypes.RemixCosign
    case notificationTypes.Create.track:
    case notificationTypes.Create.playlist:
    case notificationTypes.Create.album:
    case notificationTypes.Create.base:
      return notificationTypes.Create.base
  }
}

const getPublishUserId = (notif, baseType) => {
  if (baseType === notificationTypes.Follow) return notif.metadata.followee_user_id
  else if (baseType === notificationTypes.Repost.base) return notif.metadata.entity_owner_id
  else if (baseType === notificationTypes.Favorite.base) return notif.metadata.entity_owner_id
  else if (baseType === notificationTypes.RemixCreate) return notif.metadata.remix_parent_track_user_id
  else if (baseType === notificationTypes.RemixCosign) return notif.metadata.entity_owner_id
  else if (baseType === notificationTypes.Create.base) return notif.subscriberId
}

const alwaysSendNotifications = [
  notificationTypes.RemixCosign,
  notificationTypes.Create.base,
  notificationTypes.Create.track,
  notificationTypes.Create.playlist,
  notificationTypes.Create.album
]

const mapNotificationBaseTypeToSettings = {
  [notificationTypes.Follow]: 'followers',
  [notificationTypes.Repost.base]: 'reposts',
  [notificationTypes.Favorite.base]: 'favorites',
  [notificationTypes.RemixCreate]: 'remixes'
}

const getPublishTypes = (userId, baseNotificationType, userNotificationSettings) => {
  if (alwaysSendNotifications.includes(baseNotificationType)) {
    return [deviceType.Mobile, deviceType.Browser]
  }
  const userSettings = userNotificationSettings[userId]
  const types = []
  const settingKey = mapNotificationBaseTypeToSettings[baseNotificationType]
  if (userSettings.mobile && userSettings.mobile[settingKey]) types.push(deviceType.Mobile)
  if (userSettings.browser && userSettings.browser[settingKey]) types.push(deviceType.Browser)
  return types
}


const publishNotifications = async (notifications, metadata, userNotificationSettings, tx) => {
  for (const notification of notifications) {
    const mapNotification = notificationResponseMap[notification.type]
    const populatedNotification = {
        ...notification,
        ...(mapNotification(notification, metadata))
    }
    const publishNotifType = getPublishNotifBaseType(notification)
    const msg = pushNotificationMessagesMap[publishNotifType](populatedNotification)
    const title = notificationResponseTitleMap[notification.type]
    const userId = getPublishUserId(notification, publishNotifType)
    const types = getPublishTypes(userId, publishNotifType, userNotificationSettings)
    await publish(msg, userId, tx, true, title, types)
  }
}


async function sendNotifications (audiusLibs, notifications, tx) {
  // Parse the notification to grab the user ids that we want to notify
  const userIdsToNotify = getUserIdsToNotify(notifications)
  // Using the userIds to notify, check the DB for their notification settings 
  const userNotificationSettings = await getUserNotificationSettings(userIdsToNotify, tx)
  // Format the notifications, so that the extra information needed to build the notification is in a standard format
  const { notifications: formattedNotifications, users } = await formatNotification(notifications, userNotificationSettings, tx)
  // Get the metadata for the notifications - users/tracks/playlists from DP that are in the notification
  const metadata = await fetchNotificationMetadata(audiusLibs, users, formattedNotifications)
  // using the metadata, populate the notifications, and push them to the publish queue
  await publishNotifications(formattedNotifications, metadata, userNotificationSettings, tx)
}

module.exports = sendNotifications

module.exports.getUserIdsToNotify = getUserIdsToNotify
module.exports.getUserNotificationSettings = getUserNotificationSettings
module.exports.formatNotification = formatNotification
module.exports.fetchNotificationMetadata = fetchNotificationMetadata


