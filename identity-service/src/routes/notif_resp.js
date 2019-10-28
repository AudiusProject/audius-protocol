const request = require('request')
const models = require('../models')
const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')

const notificationTypes = {
  Follow: 'Follow',
  Repost: {
    base: 'Repost',
    track: 'RepostTrack',
    album: 'RepostAlbum',
    playlist: 'RepostPlaylist'
  }
}

module.exports = function (app) {
  /**
   * This signup function writes the encryption values from the user's browser(iv, cipherText, lookupKey)
   * into the Authentications table and the email to the Users table. This is the first step in the
   * authentication process
   */

  app.get('/notification_load', handleResponse(async (req, res, next) => {
    // let queryParams = req.query
    let reqObj = {
      method: 'get',
      url: 'http://docker.for.mac.localhost:5000/notifications?min_block_number=11512015'
    }
    let body = JSON.parse(await doRequest(reqObj))
    let notifications = body.data.notifications

    for (let notif of notifications) {
      // blocknumber + timestamp parsed for all notification types
      let blocknumber = notif.blocknumber
      let timestamp = Date.parse(notif.timestamp.slice(0, -2))

      /*
      // Handle the 'follow' notification type
      if (notif.type === notificationTypes.Follow) {
        let notificationTarget = notif.metadata.followee_user_id
        let notificationInitiator = notif.metadata.follower_user_id
        let unreadQuery = await models.Notification.findAll({
          where: {
            isRead: false,
            userId: notificationTarget,
            type: notificationTypes.Follow
          }
        })

        let notificationId = null
        // Insertion into the Notification table
        if (unreadQuery.length === 0) {
          let createNotifTx = await models.Notification.create({
            type: notificationTypes.Follow,
            isRead: false,
            isHidden: false,
            userId: notificationTarget,
            blocknumber: blocknumber,
            timestamp: timestamp
          })
          notificationId = createNotifTx.id
        } else {
          notificationId = unreadQuery[0].id
        }

        if (notificationId) {
          // Insertion into the NotificationActions table
          let notifActionCreateTx = await models.NotificationAction.findOrCreate({
            where: {
              notificationId: notificationId,
              actionEntityType: 'User',
              actionEntityId: notificationInitiator
            }
          })
        }
      }
      */

      // Handle the 'repost' notification type
      // track/album/playlist
      if (notif.type === notificationTypes.Repost.base) {
        console.log('Repost:')
        console.log(notif)
        let repostType = null
        switch (notif.metadata.entity_type) {
          case 'track':
            repostType = notificationTypes.Repost.track
            break
          case 'album':
            repostType = notificationTypes.Repost.album
            break
          case 'playlist':
            repostType = notificationTypes.Repost.playlist
            break
          default:
            throw new Error('Invalid repost type')  // TODO: gracefully handle this in try/catch
        }
        let notificationTarget = notif.metadata.entity_owner_id
        let notificationEntityId = notif.metadata.entity_id
        let initiator = notif.initiator

        let unreadQuery = await models.Notification.findAll({
          isRead: false,
          userId: notificationTarget,
          type: repostType
        })

        let notificationId = null
        // Insert new notification
        if (unreadQuery.length === 0) {
          let repostNotifTx = await models.Notification.create({
            type: repostType,
            isRead: false,
            isHidden: false,
            userId: notificationTarget,
            entityId: notificationEntityId,
            blocknumber,
            timestamp
          })
          notificationId = repostNotifTx.id
        } else {
          notificationId = unreadQuery[0].id
        }

        console.log(`Repost notif. id ${notificationId}`)
      }
    }
    return successResponse({})
  }))
}

/**
 * TODO: Eliminate this in favor of disc prov libs call
 * Since request is a callback based API, we need to wrap it in a promise to make it async/await compliant
 * @param {Object} reqObj construct request object compatible with `request` module
 */
function doRequest (reqObj) {
  return new Promise(function (resolve, reject) {
    request(reqObj, function (err, r, body) {
      if (err) reject(err)
      else resolve(body)
    })
  })
}

