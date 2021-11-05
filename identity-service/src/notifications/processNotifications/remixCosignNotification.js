
const moment = require('moment')

const models = require('../../models')
const {
  notificationTypes,
  actionEntityTypes
} = require('../constants')

/**
 * Process cosign notifications, note that a unique cosign event is created only once.
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transaction to attach to DB requests
 */
async function processCosignNotifications (notifications, tx) {
  const validNotifications = []
  for (const notification of notifications) {
    const {
      entity_id: childTrackId,
      entity_owner_id: childTrackUserId
    } = notification.metadata
    const parentTrackUserId = notification.initiator

    // Query the Notification/NotificationActions to see if the notification already exists.
    let cosignNotifications = await models.Notification.findAll({
      where: {
        userId: childTrackUserId,
        type: notificationTypes.RemixCosign,
        entityId: childTrackId
      },
      include: [{
        model: models.NotificationAction,
        as: 'actions',
        where: {
          actionEntityType: actionEntityTypes.User,
          actionEntityId: parentTrackUserId
        }
      }],
      transaction: tx
    })

    // If this track is already cosigned, ignore this notification
    if (cosignNotifications.length > 0) continue

    const blocknumber = notification.blocknumber
    const timestamp = Date.parse(notification.timestamp.slice(0, -2))
    const momentTimestamp = moment(timestamp)

    // Add 1 s to the timestamp so that it appears after the favorite/repost
    const updatedTimestamp = momentTimestamp.add(1, 's').format('YYYY-MM-DD HH:mm:ss')
    // Create a new Notification and NotificationAction
    // NOTE: Cosign Notifications do NOT stack. A new notification is created every time
    let cosignNotification = await models.Notification.create({
      type: notificationTypes.RemixCosign,
      userId: childTrackUserId,
      entityId: childTrackId,
      blocknumber,
      timestamp: updatedTimestamp
    }, { transaction: tx })

    await models.NotificationAction.create({
      notificationId: cosignNotification.id,
      actionEntityType: actionEntityTypes.User,
      actionEntityId: parentTrackUserId,
      blocknumber
    }, { transaction: tx })
    validNotifications.push(notification)
  }
  return validNotifications
}

module.exports = processCosignNotifications
