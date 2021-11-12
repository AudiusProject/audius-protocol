const { deviceType, notificationTypes } = require('../constants')
const {
  notificationResponseMap,
  notificationResponseTitleMap,
  pushNotificationMessagesMap
} = require('../formatNotificationMetadata')
const { publish, publishSolanaNotification } = require('../notificationQueue')

// Maps a notification type to it's base notification
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
    case notificationTypes.ChallengeReward:
      return notificationTypes.ChallengeReward
    case notificationTypes.MilestoneListen:
    case notificationTypes.MilestoneFavorite:
    case notificationTypes.MilestoneFollow:
    case notificationTypes.MilestoneRepost:
      return notificationTypes.Milestone
  }
}

const solanaNotificationBaseTypes = [
  notificationTypes.ChallengeReward,
  notificationTypes.MilestoneListen
]

// Gets the userId that a notification should be sent to based off the notification's base type
const getPublishUserId = (notif, baseType) => {
  if (baseType === notificationTypes.Follow) return notif.metadata.followee_user_id
  else if (baseType === notificationTypes.Repost.base) return notif.metadata.entity_owner_id
  else if (baseType === notificationTypes.Favorite.base) return notif.metadata.entity_owner_id
  else if (baseType === notificationTypes.RemixCreate) return notif.metadata.remix_parent_track_user_id
  else if (baseType === notificationTypes.RemixCosign) return notif.metadata.entity_owner_id
  else if (baseType === notificationTypes.Create.base) return notif.subscriberId
  else if (baseType === notificationTypes.ChallengeReward) return notif.initiator
  else if (baseType === notificationTypes.Milestone) return notif.initiator
}

// Notification types that always get send a notification, regardless of settings
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
  [notificationTypes.RemixCreate]: 'remixes',
  [notificationTypes.Milestone]: 'milestonesAndAchievements'
}

/**
 * Gets the publish types: mobile, browser, both, or neither
 * given a userId, the notification type and their settings
 * @param {number} userId
 * @param {string} baseNotificationType
 * @param {Object} userNotificationSettings
 */
const getPublishTypes = (userId, baseNotificationType, userNotificationSettings) => {
  if (alwaysSendNotifications.includes(baseNotificationType)) {
    return [deviceType.Mobile, deviceType.Browser]
  }
  const userSettings = userNotificationSettings[userId]
  const types = []
  const settingKey = mapNotificationBaseTypeToSettings[baseNotificationType]
  if (userSettings && userSettings.mobile && userSettings.mobile[settingKey]) types.push(deviceType.Mobile)
  if (userSettings && userSettings.browser && userSettings.browser[settingKey]) types.push(deviceType.Browser)
  return types
}

/**
 * Takes a list of notifications, populates them with extra metadata, checks their notification settings
 * and publishes it to the notification queue to be sent out.
 * @param {Array<Object>} notifications
 * @param {Object} metadata Metadata of all the users/tracks/collections needed for populating the notifications
 * @param {Object} userNotificationSettings A map of userID to their mobile & browser notification settings
 * @param {*} tx Transction for DB queries
 */
const publishNotifications = async (notifications, metadata, userNotificationSettings, tx) => {
  for (const notification of notifications) {
    const mapNotification = notificationResponseMap[notification.type]
    const populatedNotification = {
      ...notification,
      ...(mapNotification(notification, metadata))
    }
    const publishNotifType = getPublishNotifBaseType(notification)
    const msg = pushNotificationMessagesMap[publishNotifType](populatedNotification)
    const title = notificationResponseTitleMap[notification.type](populatedNotification)
    const userId = getPublishUserId(notification, publishNotifType)
    const types = getPublishTypes(userId, publishNotifType, userNotificationSettings)

    if (solanaNotificationBaseTypes.includes(notification.type)) {
      await publishSolanaNotification(msg, userId, tx, true, title, types)
    } else {
      await publish(msg, userId, tx, true, title, types)
    }
  }
}

module.exports = publishNotifications
