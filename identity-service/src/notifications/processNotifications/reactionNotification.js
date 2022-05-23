const models = require('../../models')
const { notificationTypes } = require('../constants')

async function processReactionNotifications (notifications, tx) {
  for (const notification of notifications) {
    const { slot, initiator: reactorId, metadata: { reaction_value: reactionValue, reacted_to: reactedTo, reaction_type: reactionType } } = notification

    // First find the originating tip receive notif
    const receiveTipNotification = await models.SolanaNotification.findOne({
      where: {
        type: notificationTypes.TipReceive,
        metadata: {
          [models.Sequelize.Op.contains]: {
            'tipTxSignature': reactedTo
          }
        }
      }
    })

    if (!receiveTipNotification) {
      console.error(`Received reaction to ${reactedTo} from ${reactorId}, but not corresponding tip notification`)
      return notifications
    }

    // Set it's reaction value
    receiveTipNotification.metadata = { ...receiveTipNotification.metadata, reactionValue }

    // Save out reaction value on receive tip, and create new reaction notif
    await Promise.all([
      receiveTipNotification.save({ transaction: tx }),
      models.SolanaNotification.findOrCreate({
        where: {
          slot,
          type: notificationTypes.Reaction,
          userId: receiveTipNotification.entityId, // The user receiving the reaction is the user who sent the tip, here the entityId
          entityId: reactorId, // The user who sent the reaction
          metadata: {
            reactionType,
            reactedTo,
            reactionValue
          }
        },
        transaction: tx
      })
    ])
  }
  return notifications
}

module.exports = processReactionNotifications
