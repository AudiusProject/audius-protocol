
const models = require('../../models')
const { notificationTypes } = require('../constants')

async function processSupporterRankChangeNotification (notifications, tx) {
  for (const notification of notifications) {
    const { slot, initiator: receiverUserId, metadata: { entity_id: senderUserId, rank } } = notification

    await Promise.all([
      // SupportingRankUp sent to the user who is supporting
      models.SolanaNotification.findOrCreate({
        where: {
          slot,
          type: notificationTypes.SupportingRankUp,
          userId: senderUserId,
          entityId: rank,
          metadata: {
            supportedUserId: receiverUserId
          }
        },
        transaction: tx
      }),
      // SupporterRankUp sent to the user being supported
      models.SolanaNotification.findOrCreate({
        where: {
          slot,
          type: notificationTypes.SupporterRankUp,
          userId: receiverUserId,
          entityId: rank,
          metadata: {
            supportingUserId: senderUserId
          }
        },
        transaction: tx
      })
    ])
    return notifications
  }
}

module.exports = processSupporterRankChangeNotification
