const moment = require('moment')
const models = require('../../models')
const { notificationTypes, actionEntityTypes } = require('../constants')

/**
 * Process remix create notifications, note these notifications do not "stack" meaning that
 * a notification action will never reference a previously created notification
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transaction to attach to DB requests
 */
async function processRemixCreateNotifications(notifications, tx) {
  for (const notification of notifications) {
    const {
      entity_id: childTrackId,
      remix_parent_track_user_id: parentTrackUserId,
      remix_parent_track_id: parentTrackId
    } = notification.metadata

    // Create/Find a Notification and NotificationAction for this remix create event
    // NOTE: RemixCreate Notifications do NOT stack. A new notification is created for each remix creation
    const blocknumber = notification.blocknumber
    const timestamp = Date.parse(notification.timestamp.slice(0, -2))
    const momentTimestamp = moment(timestamp)
    const updatedTimestamp = momentTimestamp
      .add(1, 's')
      .format('YYYY-MM-DD HH:mm:ss')

    let notificationObj = await models.Notification.findOne({
      where: {
        type: notificationTypes.RemixCreate,
        userId: parentTrackUserId,
        entityId: childTrackId,
        blocknumber,
        timestamp: updatedTimestamp
      },
      transaction: tx
    })
    if (notificationObj == null) {
      notificationObj = await models.Notification.create(
        {
          type: notificationTypes.RemixCreate,
          userId: parentTrackUserId,
          entityId: childTrackId,
          blocknumber,
          timestamp: updatedTimestamp
        },
        {
          transaction: tx
        }
      )
    }

    const notificationAction = await models.NotificationAction.findOne({
      where: {
        notificationId: notificationObj.id,
        actionEntityType: actionEntityTypes.Track,
        actionEntityId: parentTrackId,
        blocknumber
      },
      transaction: tx
    })
    if (notificationAction == null) {
      await models.NotificationAction.create(
        {
          notificationId: notificationObj.id,
          actionEntityType: actionEntityTypes.Track,
          actionEntityId: parentTrackId,
          blocknumber
        },
        {
          transaction: tx
        }
      )
    }
  }
  return notifications
}

module.exports = processRemixCreateNotifications
