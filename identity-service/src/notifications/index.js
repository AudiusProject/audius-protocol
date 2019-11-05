const Bull = require('bull')
const config = require('../config.js')
const models = require('../models')
const axios = require('axios')

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
  },
  MilestoneFollow: 'MilestoneFollow'
}

const actionEntityTypes = {
  User: 'User',
  Track: 'Track',
  Album: 'Album',
  Playlist: 'Playlist'
}

const notificationJobType = 'notificationProcessJob'
const milestoneJobType = 'milestoneProcessJob'

// Temporary milestone list for followers
// TODO: parse list from config somehow
const followerMilestoneList = [1, 2, 4, 6, 8, 10]

// Repost milestone list shared across tracks/albums/playlists
const repostMilestoneList = [1, 2, 4, 8]

let notifDiscProv = config.get('notificationDiscoveryProvider')

class NotificationProcessor {
  constructor () {
    this.notifQueue = new Bull(
      'notification-queue',
      { redis:
        { port: config.get('redisPort'), host: config.get('redisHost') }
      })
    this.startBlock = config.get('notificationStartBlock')
  }

  // TODO: Add Queue diagnostic to health_check or notif_check

  async init (audiusLibs) {
    // Clear any pending notif jobs
    await this.notifQueue.empty()

    // TODO: Eliminate this in favor of disc prov libs call
    // TODO: audiusLibs disc prov method update to include notificaitons
    this.audiusLibs = audiusLibs

    this.notifQueue.process(async (job, done) => {
      let minBlock = job.data.minBlock
      if (!minBlock && minBlock !== 0) throw new Error('no min block')

      try {
        // Index notifications
        let notifStats = await this.indexNotifications(minBlock)

        // Restart job with updated startBlock
        await this.notifQueue.add({
          type: notificationJobType,
          minBlock: notifStats.maxBlockNumber
        })
      } catch (e) {
        console.log(`Restarting due to error indexing notifications : ${e}`)
        // Restart job with same startBlock
        await this.notifQueue.add({
          type: notificationJobType,
          minBlock: minBlock
        })
      }
      // Temporary delay
      await new Promise(resolve => setTimeout(resolve, 3000))

      done()
    })

    let startBlock = await this.getHighestBlockNumber()
    console.log(`Starting with ${startBlock}`)
    await this.notifQueue.add({
      minBlock: startBlock,
      type: notificationJobType
    })
  }

  async getHighestBlockNumber () {
    let highestBlockNumber = await models.Notification.max('blocknumber')
    if (!highestBlockNumber) {
      highestBlockNumber = this.startBlock
    }

    // TODO: consider whether we really need to cache highest block number like this
    let date = new Date()
    console.log(`Highest block: ${highestBlockNumber} - ${date}`)
    return highestBlockNumber
  }

  async indexMilestones (userInfo) {
    console.log('INDEXMILESTONES')
    console.log(userInfo)
    let timestamp = new Date()
    let blocknumber = userInfo.maxBlockNumber

    // Handle follower count milestones
    if (userInfo.followersAdded.length > 0) {
      console.log('Follower milestones')
      console.log(followerMilestoneList)
      var queryParams = new URLSearchParams()
      userInfo.followersAdded.forEach((id) => {
        queryParams.append('user_id', id)
      })

      let reqObj = {
        method: 'get',
        url: `${notifDiscProv}/milestones/followers`,
        params: queryParams
      }

      // TODO: investigate why responses have two .data, after axios switch
      try {
        let resp = await axios(reqObj)
        let followerCounts = resp.data.data
        console.log(followerCounts)
        for (var targetUser in followerCounts) {
          if (followerCounts.hasOwnProperty(targetUser)) {
            let currentFollowerCount = followerCounts[targetUser]
            console.log(`User: ${targetUser} has ${currentFollowerCount} followers`)

            for (var i = followerMilestoneList.length; i >= 0; i--) {
              let milestoneValue = followerMilestoneList[i]
              if (currentFollowerCount >= milestoneValue) {
                console.log(`User: ${targetUser} has met milestone value ${milestoneValue}followers`)
                // MilestoneFollow entityId is the followerCount
                let existingFollowMilestoneQuery = await models.Notification.findAll({
                  where: {
                    userId: targetUser,
                    type: notificationTypes.MilestoneFollow,
                    entityId: milestoneValue
                  },
                  include: [{
                    model: models.NotificationAction,
                    as: 'actions'
                  }]
                })
                if (existingFollowMilestoneQuery.length === 0) {
                  let createMilestoneTx = await models.Notification.create({
                    userId: targetUser,
                    type: notificationTypes.MilestoneFollow,
                    entityId: milestoneValue,
                    blocknumber,
                    timestamp
                  })
                  // Note that milestoneValue is the newly met milestone count in Notifications/NotificationActions
                  let notificationId = createMilestoneTx.id
                  let notifActionCreateTx = await models.NotificationAction.findOrCreate({
                    where: {
                      notificationId: notificationId,
                      actionEntityType: actionEntityTypes.User,
                      actionEntityId: milestoneValue
                    }
                  })
                }
                break
              }
            }
          }
        }
      } catch (e) {
        console.log(e)
      }
    }

    await this.updateRepostMilestones(userInfo)
  }

  async updateRepostMilestones (userInfo) {
    let trackReposts = userInfo.repostsAdded.filter((x) => x.repostType === notificationTypes.Repost.track)
    if (trackReposts.length > 0) {
      console.log(trackReposts)
      let trackRepostIds = trackReposts.map((x) => {
        return x.repostEntityId
      })
      console.log(trackRepostIds)
      let queryParams = new URLSearchParams()
      trackRepostIds.forEach((id) => {
        queryParams.append('track_id', id)
      })
      let trackRepostCountRequest = {
        method: 'get',
        url: `${notifDiscProv}/reposts/tracks`,
        params: queryParams
      }
      let repostInfo = await axios(trackRepostCountRequest)
      console.log(repostInfo)
    }
  }

  async indexNotifications (minBlock) {
    let date = new Date()
    console.log(`indexNotifications job - ${date}`)

    let reqObj = {
      method: 'get',
      url: `${notifDiscProv}/notifications?min_block_number=${minBlock}`,
      timeout: 500 // TODO: change for prod
    }
    // TODO: investigate why this has two .data, after axios switch
    let body = (await axios(reqObj)).data
    let metadata = body.data.info
    let notifications = body.data.notifications

    for (let notif of notifications) {
      // blocknumber + timestamp parsed for all notification types
      let blocknumber = notif.blocknumber
      let timestamp = Date.parse(notif.timestamp.slice(0, -2))

      // Handle the 'follow' notification type
      if (notif.type === notificationTypes.Follow) {
        let notificationTarget = notif.metadata.followee_user_id
        // Skip notification based on user settings
        let userNotifSettings = await models.UserNotificationSettings.findOne(
          { where: { userId: notificationTarget } }
        )
        if (userNotifSettings && !userNotifSettings.followers) {
          continue
        }

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

        // Skip notification based on user settings
        let userNotifSettings = await models.UserNotificationSettings.findOne(
          { where: { userId: notificationTarget } }
        )
        if (userNotifSettings && !userNotifSettings.reposts) {
          continue
        }

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
            throw new Error('Invalid favorite type')  // TODO: gracefully handle this in try/catch
        }
        let notificationTarget = notif.metadata.entity_owner_id
        // Skip notification based on user settings
        let userNotifSettings = await models.UserNotificationSettings.findOne(
          { where: { userId: notificationTarget } }
        )
        if (userNotifSettings && !userNotifSettings.favorites) {
          continue
        }

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
            actionEntityType = actionEntityTypes.User
            break
          case 'playlist':
            createType = notificationTypes.Create.playlist
            actionEntityType = actionEntityTypes.User
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

        // The notification entity id is the uploader id for tracks
        // Each track will added to the notification actions table
        // For playlist/albums, the notification entity id is the collection id itself
        let notificationEntityId =
          actionEntityType === actionEntityTypes.Track
            ? notif.initiator
            : notif.metadata.entity_id

        // Action table entity is trackId for CreateTrack notifications
        // Allowing multiple track creates to be associated w/ a single notif for your subscription
        // For collections, the entity is the owner id, producing a distinct notif for each
        let createdActionEntityId =
          actionEntityType === actionEntityTypes.Track
            ? notif.metadata.entity_id
            : notif.metadata.entity_owner_id

        // Create notification for each user
        await Promise.all(subscribers.map(async (s) => {
          // Add notification for this user indicating the uploader has added a track
          let notificationTarget = s.subscriberId

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
        if (createType === notificationTypes.Create.album ||
            createType === notificationTypes.Create.playlist) {
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

        console.log('end of notifs')
      }
    }
  }
}

module.exports = NotificationProcessor
