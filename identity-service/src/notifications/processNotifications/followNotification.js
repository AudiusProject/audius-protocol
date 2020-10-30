const models = require('../../models')
const {
  notificationTypes,
  actionEntityTypes
} = require('../constants')

async function processFollowNotifications (notifications, tx) {
  const userFolloweeNotif = notifications.reduce((followees, notif) => {
    const { followee_user_id } = notif.metadata
    followees[followee_user_id] = (followees[followee_user_id] || []).concat(notif)
    return followees
  }, [])

  const userTargets = Object.keys(userFolloweeNotif)
  let unreadUserNotifications = await models.Notification.findAll({
    where: {
      isViewed: false,
      userId: { [models.Sequelize.Op.in]: userTargets },
      type: notificationTypes.Follow
    },
    transaction: tx
  })
  const notificationModalObjs = unreadUserNotifications

  const usersWithUnread = new Set(unreadUserNotifications.map(notif => notif.userId.toString()))
  const usersWithoutUnread = userTargets.filter(userId => !usersWithUnread.has(userId))
  if (usersWithoutUnread.length > 0) {
    const createdFollowNotifications = await models.Notification.bulkCreate(usersWithoutUnread.map(userId => {
      const userIdNotifications = userFolloweeNotif[userId]
      const lastNotification = userIdNotifications[userIdNotifications.length - 1]
      const blocknumber = lastNotification.blocknumber
      const timestamp = Date.parse(lastNotification.timestamp.slice(0, -2))
      return {
        type: notificationTypes.Follow,
        isViewed: false,
        isRead: false,
        isHidden: false,
        userId,
        blocknumber,
        timestamp
      }
    }), { transaction: tx })
    notificationModalObjs.push(...createdFollowNotifications)
  }

  for (const notificationModal of notificationModalObjs) {
    const notificationId = notificationModal.id
    const rawNotifications = userFolloweeNotif[notificationModal.userId]
    for (const notification of rawNotifications) {
      const blocknumber = notification.blocknumber
      const timestamp = Date.parse(notification.timestamp.slice(0, -2))

      // Insertion into the NotificationActions table
      let notifActionCreateTx = await models.NotificationAction.findOrCreate({
        where: {
          notificationId,
          actionEntityType: actionEntityTypes.User,
          actionEntityId: notification.metadata.follower_user_id,
          blocknumber
        },
        transaction: tx
      })
      let updatePerformed = notifActionCreateTx[1]
      if (updatePerformed) {
        // Update Notification table timestamp
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

module.exports = processFollowNotifications