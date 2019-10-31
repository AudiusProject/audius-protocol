const Bull = require('bull')
const config = require('../config.js')
const models = require('../models')
const request = require('request')

const notificationTypes = {
  Follow: 'Follow',
  Repost: {
    base: 'Repost',
    track: 'RepostTrack',
    album: 'RepostAlbum',
    playlist: 'RepostPlaylist'
  },
  Favorite: {
    base: 'Favorite',
    track: 'FavoriteTrack',
    album: 'FavoriteAlbum',
    playlist: 'FavoritePlaylist'
  },
  Create: {
    base: 'Create',
    track: 'CreateTrack',
    album: 'CreateAlbum',
    playlist: 'CreatePlaylist'
  }
}

const actionEntityTypes = {
  User: 'User',
  Track: 'Track',
  Album: 'Album',
  Playlist: 'Playlist'
}

let notifDiscProv = config.get('notificationDiscoveryProvider')

class NotificationProcessor {
  constructor () {
    this.notifQueue = new Bull(
      'notif-queue',
      { redis:
        { port: config.get('redisPort'), host: config.get('redisHost') }
      })
    this.startBlock = config.get('notificationStartBlock')
  }

  async init (audiusLibs, redis) {
    // TODO: Eliminate this in favor of disc prov libs call
    // TODO: audiusLibs disc prov method update to include notificaitons
    this.audiusLibs = audiusLibs
    this.redis = redis
    this.notifQueue.process(async (job, done) => {
      // Temporary delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      try {
        // Index notifications
        await this.indexNotifications()
      } catch (e) {
        console.log(`Error indexing notifications : ${e}`)
      }
      await this.notifQueue.add({
        type: 'notificationProcessJob'
      })
      done()
    })

    this.notifQueue.add({
      type: 'notificationProcessJob'
    })
    await this.redis.set('highestBlockNumber', this.startBlock)
  }

  async getHighestBlockNumber () {
    let highestBlockNumber = await models.Notification.max('blocknumber')
    if (!highestBlockNumber) {
      highestBlockNumber = this.startBlock
    }

    // TODO: consider whether we really need to cache highest block number like this
    let cachedHighestBlockNumber = await this.redis.get('highestBlockNumber')
    if (cachedHighestBlockNumber) {
      highestBlockNumber = cachedHighestBlockNumber
    }
    let date = new Date()
    console.log(`Highest block: ${highestBlockNumber} - ${date}`)
    return highestBlockNumber
  }

  async indexNotifications () {
    // TODO: Handle scenario where there are NO notifications returned, how do we still increment the blocknumber
    let minBlock = await this.getHighestBlockNumber()
    let reqObj = {
      method: 'get',
      url: `${notifDiscProv}/notifications?min_block_number=${minBlock}`
    }
    let body = JSON.parse(await doRequest(reqObj))
    let metadata = body.data.info
    let highestReturnedBlockNumber = metadata.max_block_number
    let cachedHighestBlockNumber = await this.redis.get('highestBlockNumber')
    if (!cachedHighestBlockNumber || highestReturnedBlockNumber > cachedHighestBlockNumber) {
      await this.redis.set('highestBlockNumber', highestReturnedBlockNumber)
    }

    let notifications = body.data.notifications
    let notificationStats = {}
    for (let notif of notifications) {
      // blocknumber + timestamp parsed for all notification types
      let blocknumber = notif.blocknumber
      let timestamp = Date.parse(notif.timestamp.slice(0, -2))

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
              actionEntityType: actionEntityTypes.User,
              actionEntityId: notificationInitiator
            }
          })
          // TODO: Handle log statements to indicate how many notifs have been processed
          let updatePerformed = notifActionCreateTx[1]
          if (updatePerformed) {
            // Update Notification table timestamp
            let newNotificationTimestamp = notifActionCreateTx[0].createdAt
            await models.Notification.update({
              timestamp: newNotificationTimestamp
            }, {
              where: { id: notificationId },
              returning: true,
              plain: true
            })
          }
        }
      }

      // Handle the 'repost' notification type
      // track/album/playlist
      if (notif.type === notificationTypes.Repost.base) {
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
        let notificationInitiator = notif.initiator

        let unreadQuery = await models.Notification.findAll({
          where: {
            isRead: false,
            isHidden: false,
            userId: notificationTarget,
            type: repostType,
            entityId: notificationEntityId
          }
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

        if (notificationId) {
          let notifActionCreateTx = await models.NotificationAction.findOrCreate({
            where: {
              notificationId: notificationId,
              actionEntityType: actionEntityTypes.User,
              actionEntityId: notificationInitiator
            }
          })
          // Update Notification table timestamp
          let updatePerformed = notifActionCreateTx[1]
          if (updatePerformed) {
            let newNotificationTimestamp = notifActionCreateTx[0].createdAt
            await models.Notification.update({
              timestamp: newNotificationTimestamp
            }, {
              where: { id: notificationId },
              returning: true,
              plain: true
            })
          }
        }
      }

      // Handle the 'favorite' notification type, track/album/playlist
      if (notif.type === notificationTypes.Favorite.base) {
        let favoriteType = null
        switch (notif.metadata.entity_type) {
          case 'track':
            favoriteType = notificationTypes.Favorite.track
            break
          case 'album':
            favoriteType = notificationTypes.Favorite.album
            break
          case 'playlist':
            favoriteType = notificationTypes.Favorite.playlist
            break
          default:
            throw new Error('Invalid repost type')  // TODO: gracefully handle this in try/catch
        }
        let notificationTarget = notif.metadata.entity_owner_id
        let notificationEntityId = notif.metadata.entity_id
        let notificationInitiator = notif.initiator
        let unreadQuery = await models.Notification.findAll({
          where: {
            isRead: false,
            isHidden: false,
            userId: notificationTarget,
            type: favoriteType,
            entityId: notificationEntityId
          }
        })

        let notificationId = null
        if (unreadQuery.length === 0) {
          let favoriteNotifTx = await models.Notification.create({
            type: favoriteType,
            isRead: false,
            isHidden: false,
            userId: notificationTarget,
            entityId: notificationEntityId,
            blocknumber,
            timestamp
          })
          notificationId = favoriteNotifTx.id
        } else {
          notificationId = unreadQuery[0].id
        }

        if (notificationId) {
          let notifActionCreateTx = await models.NotificationAction.findOrCreate({
            where: {
              notificationId: notificationId,
              actionEntityType: actionEntityTypes.User,
              actionEntityId: notificationInitiator
            }
          })
          // Update Notification table timestamp
          let updatePerformed = notifActionCreateTx[1]
          if (updatePerformed) {
            let newNotificationTimestamp = notifActionCreateTx[0].createdAt
            await models.Notification.update({
              timestamp: newNotificationTimestamp
            }, {
              where: { id: notificationId },
              returning: true,
              plain: true
            })
          }
        }
      }

      // Handle the 'create' notification type, track/album/playlist
      if (notif.type === notificationTypes.Create.base) {
        let createType = null
        let actionEntityType = null
        switch (notif.metadata.entity_type) {
          case 'track':
            createType = notificationTypes.Create.track
            actionEntityType = actionEntityTypes.Track
            break
          case 'album':
            createType = notificationTypes.Create.album
            actionEntityType = actionEntityTypes.Album
            break
          case 'playlist':
            createType = notificationTypes.Create.playlist
            actionEntityType = actionEntityTypes.Playlist
            break
          default:
            throw new Error('Invalid create type')// TODO: gracefully handle this in try/catch
        }

        // Query user IDs from subscriptions table
        // Notifications go to all users subscribing to this track uploader
        let subscribers = await models.Subscription.findAll({
          where: {
            userId: notif.initiator
          }
        })

        // No operation if no users subscribe to this creator
        if (subscribers.length === 0) { continue }

        // Create notification for each user
        await Promise.all(subscribers.map(async (s) => {
          // Add notification for this user indicating the uploader has added a track
          let notificationTarget = s.subscriberId

          // The notification entity id is the uploader id
          // Each track will added to the notification actions table
          let notificationEntityId = notif.initiator
          let unreadQuery = await models.Notification.findAll({
            where: {
              isRead: false,
              isHidden: false,
              userId: notificationTarget,
              type: createType,
              entityId: notificationEntityId
            }
          })

          let notificationId = null
          // TODO: UPDATE TIMESTAMP
          if (unreadQuery.length === 0) {
            let createTrackNotifTx = await models.Notification.create({
              isRead: false,
              isHidden: false,
              userId: notificationTarget,
              type: createType,
              entityId: notificationEntityId,
              blocknumber,
              timestamp
            })
            notificationId = createTrackNotifTx.id
          } else {
            notificationId = unreadQuery[0].id
          }

          if (notificationId) {
            // Action entity id can be one of album/playlist/track
            let createdActionEntityId = notif.metadata.entity_id
            let notifActionCreateTx = await models.NotificationAction.findOrCreate({
              where: {
                notificationId,
                actionEntityType: actionEntityType,
                actionEntityId: createdActionEntityId
              }
            })
            // TODO: - How to handle this here? 
            /*
            // Update Notification table timestamp
            let updatePerformed = notifActionCreateTx[1]
            if (updatePerformed) {
              let newNotificationTimestamp = notifActionCreateTx[0].createdAt
              await models.Notification.update({
                timestamp: newNotificationTimestamp
              }, {
                where: { id: notificationId },
                returning: true,
                plain: true
              })
            }
            */
          }
        }))

        // Dedupe album /playlist notification
        if (actionEntityType === actionEntityTypes.Album ||
            actionEntityType === actionEntityTypes.Playlist) {
          let trackIdList = notif.metadata.collection_content.track_ids
          if (trackIdList.length > 0) {
            for (var entry of trackIdList) {
              let trackId = entry.track
              let destroyTx = await models.NotificationAction.destroy({
                where: {
                  actionEntityType: actionEntityTypes.Track,
                  actionEntityId: trackId
                }
              })
            }
          }
        }
      }
    }
  }
}

module.exports = NotificationProcessor

/**
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

