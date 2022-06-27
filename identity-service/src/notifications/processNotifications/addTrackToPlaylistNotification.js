const moment = require('moment')
const models = require('../../models')
const {
  notificationTypes,
  actionEntityTypes
} = require('../constants')

/**
 * Process track added to playlist notification
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transaction to attach to DB requests
 */
async function processAddTrackToPlaylistNotification (notifications, tx) {
  const validNotifications = []

  for (const notification of notifications) {
    const {
      playlist_id: playlistId,
      track_id: trackId,
      track_owner_id: trackOwnerId
    } = notification.metadata
    const timestamp = Date.parse(notification.timestamp.slice(0, -2))
    const momentTimestamp = moment(timestamp)
    const updatedTimestamp = momentTimestamp.add(1, 's').format('YYYY-MM-DD HH:mm:ss')

    const [addTrackToPlaylistNotification] = await models.Notification.findOrCreate({
      where: {
        type: notificationTypes.AddTrackToPlaylist,
        userId: trackOwnerId,
        entityId: trackId,
        metadata: {
          playlistOwnerId: notification.initiator,
          playlistId,
          trackId
        },
        blocknumber: notification.blocknumber,
        timestamp: updatedTimestamp
      },
      transaction: tx
    })

    await models.NotificationAction.findOrCreate({
      where: {
        notificationId: addTrackToPlaylistNotification.id,
        actionEntityType: actionEntityTypes.Track,
        actionEntityId: trackId,
        blocknumber: notification.blocknumber
      },
      transaction: tx
    })

    validNotifications.push(addTrackToPlaylistNotification)
  }

  return validNotifications
}

module.exports = processAddTrackToPlaylistNotification
