const models = require('../../models')
const {
  notificationTypes,
  actionEntityTypes
} = require('../constants')

const getNotifType = (entityType) => {
  switch (entityType) {
    case 'track':
      return notificationTypes.Favorite.track
    case 'album':
      return notificationTypes.Favorite.album
    case 'playlist':
      return notificationTypes.Favorite.playlist
    default:
      return ''
  }
}

// A notification is unique by it's
// userId (owner of the content favorited), type (track/album/playlist), and entityId (trackId, ect)
const getUniqueNotificationModel = notif => `${notif.userId}:${notif.type}:${notif.entityId}`
const getUniqueNotification = notif => `${notif.metadata.entity_owner_id}:${getNotifType(notif.metadata.entity_type)}:${notif.metadata.entity_id}`

/**
 * Batch process favorite notifications, creating a notification (if prev unread) and notification action
 * for the owner of the favorited track/playlist/album
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transaction to attach to DB requests
 */
async function processFavoriteNotifications (notifications, tx) {
  // Create a mapping of unique notification by userID, type, and entity id to notification
  // This is used if there are multiple favorites of the same track,
  // then one notification is made w/ multiple actions
  const favoriteNotifs = notifications.reduce((notifs, notif) => {
    const key = getUniqueNotification(notif)
    notifs[key] = (notifs[key] || []).concat(notif)
    return notifs
  }, {})

  // Batch query the DB for non-viewed notification
  const selectNotifications = Object.keys(favoriteNotifs).map(notifKey => {
    const notif = favoriteNotifs[notifKey][0]
    return {
      isViewed: false,
      userId: notif.metadata.entity_owner_id,
      type: getNotifType(notif.metadata.entity_type),
      entityId: notif.metadata.entity_id
    }
  })

  let unreadUserNotifications = await models.Notification.findAll({
    where: { [models.Sequelize.Op.or]: selectNotifications },
    transaction: tx
  })

  const notificationModalObjs = unreadUserNotifications
  const unreadNotifications = new Set(unreadUserNotifications.map(notif => getUniqueNotificationModel(notif)))

  // Notifications that are read or not existent, so we need to make new ones
  const notificationsToCreate = Object.keys(favoriteNotifs).filter(notif => !unreadNotifications.has(notif))

  // Insert new notification for notifications that didn't exists / were already viewed
  // Favorite - userId=notif target, entityId=track/album/repost id, actionEntityType=User actionEntityId=user who favorited
  // As multiple users favorite an entity, NotificationActions are added matching the NotificationId
  if (notificationsToCreate.length > 0) {
    let createdFavoriteNotifications = await models.Notification.bulkCreate(notificationsToCreate.map(notifKey => {
      const notif = favoriteNotifs[notifKey][0]
      const blocknumber = notif.blocknumber
      const timestamp = Date.parse(notif.timestamp.slice(0, -2))
      return {
        type: getNotifType(notif.metadata.entity_type),
        isRead: false,
        isHidden: false,
        isViewed: false,
        userId: notif.metadata.entity_owner_id,
        entityId: notif.metadata.entity_id,
        blocknumber,
        timestamp
      }
    }), { transaction: tx })
    notificationModalObjs.push(...createdFavoriteNotifications)
  }

  // Create the notification actions for each notification
  for (const notificationModal of notificationModalObjs) {
    const notificationId = notificationModal.id
    const notifs = favoriteNotifs[`${notificationModal.userId}:${notificationModal.type}:${notificationModal.entityId}`]
    for (const notif of notifs) {
      const blocknumber = notif.blocknumber
      const timestamp = Date.parse(notif.timestamp.slice(0, -2))
      let notifActionCreateTx = await models.NotificationAction.findOrCreate({
        where: {
          notificationId,
          actionEntityType: actionEntityTypes.User,
          actionEntityId: notif.initiator,
          blocknumber
        },
        transaction: tx
      })
      // Update Notification table timestamp
      let updatePerformed = notifActionCreateTx[1]
      if (updatePerformed) {
        await models.Notification.update({
          timestamp
        }, {
          where: { id: notificationId },
          returning: true,
          plain: true,
          transaction: tx
        })
      }
    }
  }
  return notifications
}

module.exports = processFavoriteNotifications
