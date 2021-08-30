const models = require('../../models')
const {
    notificationTypes,
    actionEntityTypes
} = require('../constants')

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
        const [notificationObj] = await models.SolanaNotifications.findOrCreate({
            where: {
                slot,
                type: notificationTypes.ChallengeReward,
                userId: notification.initiator
            },
            transaction: tx
        })

        // TODO: Need to find out is this is needed
        await models.SolanaNotificationAction.findOrCreate({
            where: {
                slot,
                notificationId: notificationObj.id,
                actionEntityType: actionEntityTypes.Challenge,
                actionEntityId: challengeId
            },
            transaction: tx
        })
    }
}

module.exports = processChallengeRewardNotifications
