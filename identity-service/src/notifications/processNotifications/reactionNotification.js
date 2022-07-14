const models = require('../../models')
const { notificationTypes } = require('../constants')

async function processReactionNotifications (notifications, tx) {
  const notifsToReturn = []

  for (const notification of notifications) {
    const { slot, initiator: reactorId, metadata: { reaction_value: reactionValue, reacted_to_entity: reactedToEntity, reaction_type: reactionType } } = notification

    // TODO: unhardcode assumptions about the userId receiving the notification, when
    // we have additional reaction types.

    const existingNotification = await models.SolanaNotification.findOne({
      where: {
        type: notificationTypes.Reaction,
        userId: reactedToEntity.tip_sender_id, // The user receiving the reaction is the user who sent the tip
        entityId: reactorId, // The user who sent the reaction
        metadata: {
          reactionType,
          reactedToEntity
        }
      },
      transaction: tx
    })

    // In the case that the notification already exists, avoid returning it to prevent
    // sending it a second time. Just update or delete the original reaction value.
    if (existingNotification) {
      if (parseInt(reactionValue) === 0) {
        // Destroy reaction if undoing reaction value
        await existingNotification.destroy({ transaction: tx })
      } else {
        // Have to recreate the metadata object for save to work properly
        existingNotification.metadata = {
          ...existingNotification.metadata,
          reactionValue
        }
        await existingNotification.save({ transaction: tx })
      }
    } else {
      notifsToReturn.push(notification)
      await models.SolanaNotification.create({
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
      {
        transaction: tx
      }
      )
    }
  }

  return notifsToReturn
}

module.exports = processReactionNotifications
