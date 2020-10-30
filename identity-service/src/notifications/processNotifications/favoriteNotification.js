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

const getUniqueNotificationModel = notif => `${notif.userId}:${notif.type}:${notif.entityId}`
const getUniqueNotification = notif => `${notif.metadata.entity_owner_id}:${getNotifType(notif.metadata.entity_type)}:${notif.metadata.entity_id}`


async function processFavoriteNotifications (notifications, tx) {
  const favoriteNotifs = notifications.reduce((notifs, notif) => {
    const key = getUniqueNotification(notif)
    notifs[key] = (notifs[key] || []).concat(notif)
    return notifs
  }, {})
 
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
    where: { [models.Sequelize.Op.or] : selectNotifications },
    transaction: tx
  })

  const notificationModalObjs = unreadUserNotifications

  const unreadNotifications = new Set(unreadUserNotifications.map(notif => getUniqueNotificationModel(notif)))
  const notificationsWithoutUnread = Object.keys(favoriteNotifs).filter(notif => !unreadNotifications.has(notif))

  // Insert new notification
  // Favorite - userId=notif target, entityId=track/album/repost id, actionEntityType=User actionEntityId=user who favorited
  // As multiple users favorite an entity, NotificationActions are added matching the NotificationId
  if (notificationsWithoutUnread.length > 0) {
    let createdFavoriteNotifications = await models.Notification.bulkCreate(notificationsWithoutUnread.map(notifKey => {
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
}

module.exports = processFavoriteNotifications
