const { deviceType, notificationTypes } = require('../constants')
const models = require('../../models')
const {
  notificationResponseMap,
  notificationResponseTitleMap,
  pushNotificationMessagesMap
} = require('../formatNotificationMetadata')
const { publish, publishSolanaNotification } = require('../notificationQueue')
const { getFeatureFlag, FEATURE_FLAGS } = require('../../featureFlag')
const { logger } = require('../../logging')

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
    case notificationTypes.TierChange:
      return notificationTypes.TierChange
    case notificationTypes.AddTrackToPlaylist:
      return notificationTypes.AddTrackToPlaylist
    case notificationTypes.Reaction:
      return notificationTypes.Reaction
    case notificationTypes.TipReceive:
      return notificationTypes.TipReceive
    case notificationTypes.SupporterRankUp:
      return notificationTypes.SupporterRankUp
    case notificationTypes.SupportingRankUp:
      return notificationTypes.SupportingRankUp
    case notificationTypes.SupporterDethroned:
      return notificationTypes.SupporterDethroned
  }
}

const solanaNotificationBaseTypes = [
  notificationTypes.ChallengeReward,
  notificationTypes.MilestoneListen,
  notificationTypes.TipReceive,
  notificationTypes.Reaction,
  notificationTypes.SupporterRankUp,
  notificationTypes.SupportingRankUp,
  notificationTypes.SupporterDethroned
]

// Gets the userId that a notification should be sent to based off the notification's base type
const getPublishUserId = (notif, baseType) => {
  if (baseType === notificationTypes.Follow)
    return notif.metadata.followee_user_id
  else if (baseType === notificationTypes.Repost.base)
    return notif.metadata.entity_owner_id
  else if (baseType === notificationTypes.Favorite.base)
    return notif.metadata.entity_owner_id
  else if (baseType === notificationTypes.RemixCreate)
    return notif.metadata.remix_parent_track_user_id
  else if (baseType === notificationTypes.RemixCosign)
    return notif.metadata.entity_owner_id
  else if (baseType === notificationTypes.Create.base) return notif.subscriberId
  else if (baseType === notificationTypes.ChallengeReward)
    return notif.initiator
  else if (baseType === notificationTypes.Milestone) return notif.initiator
  else if (baseType === notificationTypes.TierChange) return notif.initiator
  else if (baseType === notificationTypes.AddTrackToPlaylist)
    return notif.metadata.trackOwnerId
  else if (baseType === notificationTypes.Reaction)
    return notif.metadata.reacted_to_entity.tip_sender_id
  else if (baseType === notificationTypes.SupporterRankUp)
    return notif.initiator
  else if (baseType === notificationTypes.SupportingRankUp)
    return notif.metadata.entity_id
  else if (baseType === notificationTypes.TipReceive) return notif.initiator
  else if (baseType === notificationTypes.SupporterDethroned)
    return notif.initiator
}

// Notification types that always get send a notification, regardless of settings
const alwaysSendNotifications = [
  notificationTypes.RemixCosign,
  notificationTypes.Create.base,
  notificationTypes.Create.track,
  notificationTypes.Create.playlist,
  notificationTypes.Create.album,
  notificationTypes.ChallengeReward,
  notificationTypes.AddTrackToPlaylist,
  notificationTypes.Reaction,
  notificationTypes.TipReceive,
  notificationTypes.SupporterRankUp,
  notificationTypes.SupportingRankUp,
  notificationTypes.SupporterDethroned
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
const getPublishTypes = (
  userId,
  baseNotificationType,
  userNotificationSettings
) => {
  if (alwaysSendNotifications.includes(baseNotificationType)) {
    return [deviceType.Mobile, deviceType.Browser]
  }
  const userSettings = userNotificationSettings[userId]
  const types = []
  const settingKey = mapNotificationBaseTypeToSettings[baseNotificationType]
  if (userSettings && userSettings.mobile && userSettings.mobile[settingKey])
    types.push(deviceType.Mobile)
  if (userSettings && userSettings.browser && userSettings.browser[settingKey])
    types.push(deviceType.Browser)
  return types
}

/**
 * Checks if a notification type is enabled with optimizely
 * @param {string} notificationType
 * @param {*} optimizelyClient Optimizely client
 */
const shouldFilterOutNotification = (notificationType, optimizelyClient) => {
  if (!optimizelyClient) {
    return false
  }
  if (notificationType === notificationTypes.ChallengeReward) {
    return !getFeatureFlag(
      optimizelyClient,
      FEATURE_FLAGS.REWARDS_NOTIFICATIONS_ENABLED
    )
  }
  if (
    [
      notificationTypes.TipReceive,
      notificationTypes.Reaction,
      notificationTypes.SupporterRankUp,
      notificationTypes.SupportingRankUp
    ].includes(notificationType)
  ) {
    return false
  }
  if (notificationType === notificationTypes.SupporterDethroned) {
    return !getFeatureFlag(
      optimizelyClient,
      FEATURE_FLAGS.SUPPORTER_DETHRONED_PUSH_NOTIFS_ENABLED
    )
  }
  return false
}

/**
 * Takes a list of notifications, populates them with extra metadata, checks their notification settings
 * and publishes it to the notification queue to be sent out.
 * @param {Array<Object>} notifications
 * @param {Object} metadata Metadata of all the users/tracks/collections needed for populating the notifications
 * @param {Object} userNotificationSettings A map of userID to their mobile & browser notification settings
 * @param {*} tx Transction for DB queries
 */
const publishNotifications = async (
  notifications,
  metadata,
  userNotificationSettings,
  tx,
  optimizelyClient
) => {
  const initiators = models.User.findAll({
    where: {
      blockchainUserId: notifications.map((notif) => notif.initiator)
    }
  })
  const initiatorMap = initiators.reduce((acc, initiator) => {
    acc[initiator.blockchainUserId] = initiator
    return acc
  }, {})

  for (const notification of notifications) {
    const mapNotification = notificationResponseMap[notification.type]
    const populatedNotification = {
      ...notification,
      ...mapNotification(notification, metadata)
    }
    const publishNotifType = getPublishNotifBaseType(notification)
    const msg = pushNotificationMessagesMap[publishNotifType](
      populatedNotification
    )
    const title = notificationResponseTitleMap[notification.type](
      populatedNotification
    )
    const userId = getPublishUserId(notification, publishNotifType)
    const types = getPublishTypes(
      userId,
      publishNotifType,
      userNotificationSettings
    )
    const initiatorUserId = notification.initiator

    // Don't publish events for deactivated users
    const isReceiverDeactivated =
      metadata.users[userId] && metadata.users[userId].is_deactivated
    const initiatingUser = initiatorMap[initiatorUserId]
    const isInitiatorAbusive =
      initiatorMap[initiatorUserId] &&
      (initiatingUser.isBlockedFromRelay ||
        initiatingUser.isBlockedFromNotifications)
    if (isReceiverDeactivated) {
      continue
    }
    if (isInitiatorAbusive) {
      logger.info(
        `publishNotifications | notification initiator with user id ${initiatorUserId} is abusive, skipping...`
      )
      continue
    }

    const shouldFilter = shouldFilterOutNotification(
      notification.type,
      optimizelyClient
    )
    if (shouldFilter) {
      continue
    }

    if (solanaNotificationBaseTypes.includes(notification.type)) {
      await publishSolanaNotification(
        msg,
        userId,
        tx,
        true,
        title,
        types,
        notification
      )
    } else {
      await publish(msg, userId, tx, true, title, types, notification)
    }
  }
}

module.exports = publishNotifications
