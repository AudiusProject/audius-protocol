const models = require('../../models')
const {
  notificationTypes,
  actionEntityTypes
} = require('../constants')

const getNotifType = (entityType) => {
  switch (entityType) {
    case 'track':
      return notificationTypes.Repost.track
    case 'album':
      return notificationTypes.Repost.album
    case 'playlist':
      return notificationTypes.Repost.playlist
    default:
      return ''
  }
}

const getUniqueNotificationModel = notif => `${notif.userId}:${notif.type}:${notif.entityId}`
const getUniqueNotification = notif => `${notif.metadata.entity_owner_id}:${getNotifType(notif.metadata.entity_type)}:${notif.metadata.entity_id}`

async function processBaseRepostNotifications (notifications, tx) {
  const repostNotifs = notifications.reduce((notifs, notif) => {
    const key = getUniqueNotification(notif)
    notifs[key] = (notifs[key] || []).concat(notif)
    return notifs
  }, {})

  const selectNotifications = Object.keys(repostNotifs).map(notifKey => {
    const notif = repostNotifs[notifKey][0]
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
  const notificationsWithoutUnread = Object.keys(repostNotifs).filter(notif => !unreadNotifications.has(notif))

  // Insert new notification
  // Repost - userId=notif target, entityId=track/album/repost id, actionEntityType=User actionEntityId=user who reposted
  // As multiple users repost an entity, NotificationActions are added matching the NotificationId
  if (notificationsWithoutUnread.length > 0) {
    let createdRepostNotifications = await models.Notification.bulkCreate(notificationsWithoutUnread.map(notifKey => {
      const notif = repostNotifs[notifKey][0]
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
    notificationModalObjs.push(...createdRepostNotifications)
  }

  for (const notificationModal of notificationModalObjs) {
    const notificationId = notificationModal.id
    const notifs = repostNotifs[`${notificationModal.userId}:${notificationModal.type}:${notificationModal.entityId}`]
    for (const notif of notifs) {
      const blocknumber = notif.blocknumber
      const timestamp = Date.parse(notif.timestamp.slice(0, -2))
      let notifActionCreateTx = await models.NotificationAction.findOrCreate({
        where: {
          notificationId: notificationId,
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

module.exports = processBaseRepostNotifications