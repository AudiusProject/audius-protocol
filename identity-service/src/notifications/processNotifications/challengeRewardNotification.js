const models = require('../../models')
const { notificationTypes } = require('../constants')

/**
 * Process challenge reward notifications, note these notifications do not "stack" meaning that
 * a notification action will never reference a previously created notification
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transaction to attach to DB requests
 */
async function processChallengeRewardNotifications(notifications, tx) {
  for (const notification of notifications) {
    const { challenge_id: challengeId } = notification.metadata

    // Create/Find a Notification and NotificationAction for this event
    // NOTE: ChallengeReward Notifications do NOT stack. A new notification is created for each
    const slot = notification.slot
    let notificationObj = await models.SolanaNotification.findOne({
      where: {
        slot,
        type: notificationTypes.ChallengeReward,
        userId: notification.initiator
      },
      transaction: tx
    })
    if (notificationObj == null) {
      notificationObj = await models.SolanaNotification.create(
        {
          slot,
          type: notificationTypes.ChallengeReward,
          userId: notification.initiator
        },
        {
          transaction: tx
        }
      )
    }

    // TODO: Need to find out is this is needed
    const notificationAction = await models.SolanaNotificationAction.findOne({
      where: {
        slot,
        notificationId: notificationObj.id,
        actionEntityType: challengeId,
        actionEntityId: notification.initiator
      },
      transaction: tx
    })
    if (notificationAction == null) {
      await models.SolanaNotificationAction.create(
        {
          slot,
          notificationId: notificationObj.id,
          actionEntityType: challengeId,
          actionEntityId: notification.initiator
        },
        {
          transaction: tx
        }
      )
    }
  }
  return notifications
}

module.exports = processChallengeRewardNotifications
