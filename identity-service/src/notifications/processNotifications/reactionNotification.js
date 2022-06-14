const models = require('../../models')
const { notificationTypes } = require('../constants')

async function processReactionNotifications (notifications, tx) {
  for (const notification of notifications) {
    const { slot, initiator: reactorId, metadata: { reaction_value: reactionValue, reacted_to_entity: reactedToEntity, reaction_type: reactionType } } = notification

    // TODO: unhardcode assumptions about the userId receiving the notification, when
    // we have additional reaction types.

    await models.SolanaNotification.findOrCreate({
      where: {
        slot,
        type: notificationTypes.Reaction,
        userId: reactedToEntity.tip_sender_id, // The user receiving the reaction is the user who sent the tip
        entityId: reactorId, // The user who sent the reaction
        metadata: {
          reactionType,
          reactedToEntity,
          reactionValue
        }
      },
      transaction: tx
    })
  }
  return notifications
}

module.exports = processReactionNotifications
