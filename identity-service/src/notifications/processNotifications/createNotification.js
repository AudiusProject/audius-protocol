const models = require('../../models')
const {
  bulkGetSubscribersFromDiscovery,
  shouldReadSubscribersFromDiscovery
} = require('../utils')
const { logger } = require('../../logging')
const { notificationTypes, actionEntityTypes } = require('../constants')

const getNotifType = (entityType) => {
  switch (entityType) {
    case 'track':
      return {
        createType: notificationTypes.Create.track,
        actionEntityType: actionEntityTypes.Track
      }
    case 'album':
      return {
        createType: notificationTypes.Create.album,
        actionEntityType: actionEntityTypes.User
      }
    case 'playlist':
      return {
        createType: notificationTypes.Create.playlist,
        actionEntityType: actionEntityTypes.User
      }
    default:
      return {}
  }
}

/**
 * Batch process create notifications, by bulk insertion in the DB for each
 * set of subscribers and dedpupe tracks in collections.
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transcation to attach to DB requests
 * @param {*} optimizelyClient Optimizely client for feature flags
 */
async function processCreateNotifications(notifications, tx, optimizelyClient) {
  const validNotifications = []

  // If READ_SUBSCRIBERS_FROM_DISCOVERY_ENABLED is enabled, bulk fetch all subscriber IDs
  // from discovery for the initiators of create notifications.
  const readSubscribersFromDiscovery = shouldReadSubscribersFromDiscovery(optimizelyClient)

  logger.info(
    `processCreateNotifications: readSubscribersFromDiscovery: ${readSubscribersFromDiscovery}`
  )
  let userSubscribersMap = {}
  if (readSubscribersFromDiscovery) {
    const userIds = new Set(notifications.map((notif) => notif.initiator))
    logger.info(
      `processCreateNotifications: userIds: ${JSON.stringify([...userIds])}, size: ${userIds.size}`
    )
    if (userIds.size > 0) {
      userSubscribersMap = bulkGetSubscribersFromDiscovery(userIds)
    }
  }

  for (const notification of notifications) {
    // If the initiator is the main audius account, skip the notification
    // NOTE: This is a temp fix to not stall identity service
    if (notification.initiator === 51) {
      continue
    }
    const blocknumber = notification.blocknumber
    const timestamp = Date.parse(notification.timestamp.slice(0, -2))
    const { createType, actionEntityType } = getNotifType(
      notification.metadata.entity_type
    )

    // Notifications go to all users subscribing to this content uploader
    logger.info(`processCreateNotifications: type of map: ${typeof userSubscribersMap}`)
    let subscribers = userSubscribersMap[notification.initiator] || []
    logger.info(`processCreateNotifications: subscribers from map: ${subscribers.toString()}`)
    if (!readSubscribersFromDiscovery) {
      // Query user IDs from subscriptions table
      subscribers = await models.Subscription.findAll({
        where: {
          userId: notification.initiator
        },
        transaction: tx
      })
    }

    // No operation if no users subscribe to this creator
    if (subscribers.length === 0) continue

    // The notification entity id is the uploader id for tracks
    // Each track will added to the notification actions table
    // For playlist/albums, the notification entity id is the collection id itself
    const notificationEntityId =
      actionEntityType === actionEntityTypes.Track
        ? notification.initiator
        : notification.metadata.entity_id

    // Action table entity is trackId for CreateTrack notifications
    // Allowing multiple track creates to be associated w/ a single notification for your subscription
    // For collections, the entity is the owner id, producing a distinct notification for each
    const createdActionEntityId =
      actionEntityType === actionEntityTypes.Track
        ? notification.metadata.entity_id
        : notification.metadata.entity_owner_id

    // Query all subscribers for a un-viewed notification - is no un-view notification exists a new one is created
    let subscriberIds = subscribers
    if (!readSubscribersFromDiscovery) {
      subscriberIds = subscribers.map((s) => s.subscriberId)
    }
    logger.info(`processCreateNotifications: subscriberIds: ${subscriberIds.toString()}`)
    const unreadSubscribers = await models.Notification.findAll({
      where: {
        isViewed: false,
        userId: { [models.Sequelize.Op.in]: subscriberIds },
        type: createType,
        entityId: notificationEntityId
      },
      transaction: tx
    })
    const notificationIds = unreadSubscribers.map((notif) => notif.id)
    const unreadSubscribersUserIds = new Set(
      unreadSubscribers.map((s) => s.userId)
    )
    const subscriberIdsWithoutNotification = subscriberIds.filter(
      (s) => !unreadSubscribersUserIds.has(s)
    )
    if (subscriberIdsWithoutNotification.length > 0) {
      // Bulk create notifications for users that do not have a un-viewed notification
      const createTrackNotifTx = await models.Notification.bulkCreate(
        subscriberIdsWithoutNotification.map(
          (id) => ({
            isViewed: false,
            isRead: false,
            isHidden: false,
            userId: id,
            type: createType,
            entityId: notificationEntityId,
            blocknumber,
            timestamp
          }),
          { transaction: tx }
        )
      )
      notificationIds.push(...createTrackNotifTx.map((notif) => notif.id))
    }

    await Promise.all(
      notificationIds.map(async (notificationId) => {
        // Action entity id can be one of album/playlist/track
        const notifActionCreateTx =
          await models.NotificationAction.findOrCreate({
            where: {
              notificationId,
              actionEntityType: actionEntityType,
              actionEntityId: createdActionEntityId,
              blocknumber
            },
            transaction: tx
          })

        // Update Notification table timestamp
        const updatePerformed = notifActionCreateTx[1]
        if (updatePerformed) {
          await models.Notification.update(
            {
              timestamp
            },
            {
              where: { id: notificationId },
              returning: true,
              plain: true,
              transaction: tx
            }
          )
        }
      })
    )

    // Dedupe album /playlist notification
    if (
      createType === notificationTypes.Create.album ||
      createType === notificationTypes.Create.playlist
    ) {
      const trackIdObjectList =
        notification.metadata.collection_content.track_ids
      if (trackIdObjectList.length > 0) {
        // Clear duplicate notifications from identity database
        for (const entry of trackIdObjectList) {
          const trackId = entry.track
          await models.NotificationAction.destroy({
            where: {
              actionEntityType: actionEntityTypes.Track,
              actionEntityId: trackId
            },
            transaction: tx
          })
        }
      }
    }
    validNotifications.push(notification)
  }
  return validNotifications
}

module.exports = processCreateNotifications
