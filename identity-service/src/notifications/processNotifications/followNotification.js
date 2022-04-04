const models = require('../../models')
const {
  notificationTypes,
  actionEntityTypes
} = require('../constants')

/**
 * Batch process follow notifications, creating a notification (if prev unread) and notification action
 * for the user that is followed
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transaction to attach to DB requests
 */
async function processFollowNotifications (notifications, tx) {
  // Create a mapping of user ids of users that are followed to the user that follows them
  // This is used if there are multiple users following the same user id, then one notification is
  // made w/ multiple actions for each of the followers
  const userFolloweeNotif = notifications.reduce((followees, notification) => {
    const { followee_user_id: foloweeId } = notification.metadata
    followees[foloweeId] = (followees[foloweeId] || []).concat(notification)
    return followees
  }, [])

  // Array of user ids that are followed
  const userTargets = Object.keys(userFolloweeNotif)

  // Batch query the DB for non-viewed notification
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
  const notificationsToCreate = userTargets.filter(userId => !usersWithUnread.has(userId))
  if (notificationsToCreate.length > 0) {
    // Insert new notification for users that didn't have a notification / have on that is already viewed
    const createdFollowNotifications = await models.Notification.bulkCreate(notificationsToCreate.map(userId => {
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

  // Create the notification actions that point to the notification
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
  return notifications
}

module.exports = processFollowNotifications
