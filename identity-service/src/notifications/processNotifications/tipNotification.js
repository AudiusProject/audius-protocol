const models = require('../../models')
const { notificationTypes } = require('../constants')

async function processTipNotifications (notifications, tx) {
  for (const notification of notifications) {
    const { slot, initiator: receiverId, metadata: { amount, entity_id: senderId, tx_signature: tipTxSignature } } = notification

    // Create the sender notif
    await Promise.all([
      models.SolanaNotification.findOrCreate({
        where: {
          slot,
          type: notificationTypes.TipSend,
          userId: senderId, // The send notif goes to the sender
          entityId: receiverId,
          metadata: {
            tipTxSignature,
            amount
          }
        },
        transaction: tx
      }),
      // Create the receiver notif
      models.SolanaNotification.findOrCreate({
        where: {
          slot,
          type: notificationTypes.TipReceive,
          userId: receiverId,
          entityId: senderId,
          metadata: {
            tipTxSignature,
            amount
          }
        },
        transaction: tx
      })
    ])
  }
  return notifications
}

module.exports = processTipNotifications
