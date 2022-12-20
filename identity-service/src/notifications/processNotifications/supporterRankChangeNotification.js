const models = require('../../models')
const { notificationTypes } = require('../constants')
const { decodeHashId } = require('../utils')
const notificationUtils = require('../utils')

async function processSupporterRankChangeNotification(notifications, tx) {
  const notificationsToAdd = []
  for (const notification of notifications) {
    const {
      slot,
      initiator: receiverUserId,
      metadata: { entity_id: senderUserId, rank }
    } = notification

    // If this is a new top supporter, see who just became dethroned
    if (rank === 1) {
      const supporters = await notificationUtils.getSupporters(receiverUserId)

      const isSingleSupporter = supporters.length < 2
      if (!isSingleSupporter) {
        const topSupporterId = decodeHashId(supporters[0].sender.id)
        const dethronedUserId = decodeHashId(supporters[1].sender.id)

        // Ensure that the top supporter on DN is the top supporter that caused this index
        const isDiscoveryUpToDate = topSupporterId === senderUserId
        // Ensure that you don't get dethroned for a tie
        const isTie = topSupporterId === dethronedUserId

        if (isDiscoveryUpToDate && !isTie) {
          // Create the notif model for the DB
          const dethronedNotification = await models.SolanaNotification.findOne(
            {
              where: {
                slot,
                type: notificationTypes.SupporterDethroned,
                userId: dethronedUserId, // Notif goes to the dethroned user
                entityId: 2, // Rank 2
                metadata: {
                  supportedUserId: receiverUserId, // The user originally tipped
                  newTopSupporterUserId: topSupporterId, // The usurping user
                  oldAmount: supporters[1].amount,
                  newAmount: supporters[0].amount
                }
              },
              transaction: tx
            }
          )
          if (dethronedNotification == null) {
            await models.SolanaNotification.create(
              {
                slot,
                type: notificationTypes.SupporterDethroned,
                userId: dethronedUserId, // Notif goes to the dethroned user
                entityId: 2, // Rank 2
                metadata: {
                  supportedUserId: receiverUserId, // The user originally tipped
                  newTopSupporterUserId: topSupporterId, // The usurping user
                  oldAmount: supporters[1].amount,
                  newAmount: supporters[0].amount
                }
              },
              {
                transaction: tx
              }
            )
          }

          // Create a fake notif from discovery for further processing down the pipeline
          notificationsToAdd.push({
            slot,
            type: notificationTypes.SupporterDethroned,
            initiator: dethronedUserId, // Notif goes to the dethroned user
            metadata: {
              supportedUserId: receiverUserId, // The user originally tipped
              newTopSupporterUserId: topSupporterId, // The usurping user
              oldAmount: supporters[1].amount,
              newAmount: supporters[0].amount
            }
          })
        }
      }
    }

    // SupportingRankUp sent to the user who is supporting
    const senderNotification = await models.SolanaNotification.findOne({
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
    })
    if (senderNotification == null) {
      await models.SolanaNotification.create(
        {
          slot,
          type: notificationTypes.SupportingRankUp,
          userId: senderUserId,
          entityId: rank,
          metadata: {
            supportedUserId: receiverUserId
          }
        },
        {
          transaction: tx
        }
      )
    }

    // SupporterRankUp sent to the user being supported
    const receiverNotification = await models.SolanaNotification.findOrCreate({
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
    if (receiverNotification == null) {
      await models.SolanaNotification.create(
        {
          slot,
          type: notificationTypes.SupporterRankUp,
          userId: receiverUserId,
          entityId: rank,
          metadata: {
            supportingUserId: senderUserId
          }
        },
        {
          transaction: tx
        }
      )
    }
  }
  return notifications.concat(notificationsToAdd)
}

module.exports = processSupporterRankChangeNotification
