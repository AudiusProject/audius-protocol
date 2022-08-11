
const { default: Axios } = require('axios')
const audiusLibsWrapper = require('../../audiusLibsInstance')
const models = require('../../models')
const { notificationTypes } = require('../constants')
const { decodeHashId, encodeHashId } = require('../utils')

async function processSupporterRankChangeNotification (notifications, tx) {
  for (const notification of notifications) {
    const { slot, initiator: receiverUserId, metadata: { entity_id: senderUserId, rank } } = notification

    const promises = [
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
    ]

    // If this is a new top supporter, see who just became dethroned
    if (rank === 1) {
      const supporters = await getSupporters(receiverUserId)

      const isSingleSupporter = supporters.length < 2
      if (!isSingleSupporter) {
        const topSupporterId = decodeHashId(supporters[0].sender.id)
        const dethronedUserId = decodeHashId(supporters[1].sender.id)

        // Ensure that the top supporter on DN is the top supporter that caused this index
        const isDiscoveryUpToDate = topSupporterId === senderUserId
        // Ensure that you don't get dethroned for a tie
        const isTie = topSupporterId === dethronedUserId

        if (isDiscoveryUpToDate && !isTie) {
          const dethronedNotif = models.SolanaNotification.findOrCreate({
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
          })

          // Create the notif model for the DB
          promises.push(dethronedNotif)

          // Create a fake notif from discovery for further processing down the pipeline
          notifications.push({
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

    await Promise.all(promises)
    return notifications
  }
}

const getSupporters = async (receiverUserId) => {
  const encodedReceiverId = encodeHashId(receiverUserId)
  const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()
  const url = `${discoveryProvider.discoveryProviderEndpoint}/v1/full/users/${encodedReceiverId}/supporters`

  try {
    const response = await Axios({
      method: 'get',
      url
    })
    return response.data.data
  } catch (e) {
    console.error(`Error fetching supporters for user: ${receiverUserId}: ${e}`)
    return []
  }
}

module.exports = processSupporterRankChangeNotification
