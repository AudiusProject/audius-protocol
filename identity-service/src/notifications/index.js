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
  MilestoneFollow: 'MilestoneFollow',
  MilestoneRepost: 'MilestoneRepost',
  MilestoneFavorite: 'MilestoneFavorite'
}

const actionEntityTypes = {
  User: 'User',
  Track: 'Track',
  Album: 'Album',
  Playlist: 'Playlist'
}

const notificationJobType = 'notificationProcessJob'

// Temporary milestone list for followers
// TODO: parse list from config somehow
const followerMilestoneList = [1, 2, 4, 6, 8, 10]

// Repost milestone list shared across tracks/albums/playlists
const repostMilestoneList = [1, 2, 3, 4, 5, 8]

// Favorite milestone list shared across tracks/albums/playlists
const favoriteMilestoneList = [1, 2, 3, 4, 5, 8]

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
        let maxBlockNumber = await this.indexNotifications(minBlock)

        // Restart job with updated startBlock
        await this.notifQueue.add({
          type: notificationJobType,
          minBlock: maxBlockNumber
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

  async indexMilestones (milestones, owners, metadata) {
    // Index follower milestones into notifications table
    let followersAddedDictionary = milestones.follower_counts
    let timestamp = new Date()
    let blocknumber = metadata.max_block_number
    let usersWithNewFollowers = Object.keys(followersAddedDictionary)

    for (var targetUser of usersWithNewFollowers) {
      if (followersAddedDictionary.hasOwnProperty(targetUser)) {
        let currentFollowerCount = followersAddedDictionary[targetUser]
        console.log(`User: ${targetUser} has ${currentFollowerCount} followers`)
        for (var i = followerMilestoneList.length; i >= 0; i--) {
          let milestoneValue = followerMilestoneList[i]
          if (currentFollowerCount >= milestoneValue) {
            console.log(`User: ${targetUser} has met milestone value ${milestoneValue} followers`)
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

    // Index repost milestones
    await this.updateRepostMilestones(milestones.repost_counts, owners, blocknumber, timestamp)

    // Index favorite milestones
    await this.updateFavoriteMilestones(milestones.favorite_counts, owners, blocknumber, timestamp)
  }

  async updateRepostMilestones (repostCounts, owners, blocknumber, timestamp) {
    let tracksReposted = Object.keys(repostCounts.tracks)
    let albumsReposted = Object.keys(repostCounts.albums)
    let playlistsReposted = Object.keys(repostCounts.playlists)

    for (var repostedTrackId of tracksReposted) {
      let trackOwnerId = owners.tracks[repostedTrackId]
      let trackRepostCount = repostCounts.tracks[repostedTrackId]
      console.log(`User ${trackOwnerId}, track ${repostedTrackId}, repost count ${trackRepostCount}`)
      for (var i = repostMilestoneList.length; i >= 0; i--) {
        let milestoneValue = repostMilestoneList[i]
        if (trackRepostCount >= milestoneValue) {
          console.log(`Track ${repostedTrackId}, repost count ${trackRepostCount} has met milestone ${milestoneValue}`)
          await this.processRepostMilestone(
            trackOwnerId,
            repostedTrackId,
            actionEntityTypes.Track,
            milestoneValue,
            blocknumber,
            timestamp)
          break
        }
      }
    }

    for (var repostedAlbumId of albumsReposted) {
      let albumOwnerId = owners.albums[repostedAlbumId]
      let albumRepostCount = repostCounts.albums[repostedAlbumId]
      console.log(`User ${albumOwnerId}, album ${repostedAlbumId}, repost count ${albumRepostCount}`)
      for (var j = repostMilestoneList.length; j >= 0; j--) {
        let milestoneValue = repostMilestoneList[j]
        if (albumRepostCount >= milestoneValue) {
          console.log(`album ${repostedAlbumId}, repost count ${albumRepostCount} has met milestone ${milestoneValue}`)
          await this.processRepostMilestone(
            albumOwnerId,
            repostedAlbumId,
            actionEntityTypes.Album,
            milestoneValue,
            blocknumber,
            timestamp)
          break
        }
      }
    }

    for (var repostedPlaylistId of playlistsReposted) {
      let playlistOwnerId = owners.playlists[repostedPlaylistId]
      let playlistRepostCount = repostCounts.playlists[repostedPlaylistId]
      console.log(`User ${playlistOwnerId}, playlist ${repostedPlaylistId}, repost count ${playlistRepostCount}`)
      for (var k = repostMilestoneList.length; k >= 0; k--) {
        let milestoneValue = repostMilestoneList[k]
        if (playlistRepostCount >= milestoneValue) {
          console.log(`Playlist ${repostedPlaylistId}, repost count ${playlistRepostCount} has met milestone ${milestoneValue}`)
          await this.processRepostMilestone(
            playlistOwnerId,
            repostedPlaylistId,
            actionEntityTypes.Playlist,
            milestoneValue,
            blocknumber,
            timestamp)
          break
        }
      }
    }
  }

  async updateFavoriteMilestones (favoriteCounts, owners, blocknumber, timestamp) {
    let tracksFavorited = Object.keys(favoriteCounts.tracks)
    let albumsFavorited = Object.keys(favoriteCounts.albums)
    let playlistsFavorited = Object.keys(favoriteCounts.playlists)

    for (var favoritedTrackId of tracksFavorited) {
      let trackOwnerId = owners.tracks[favoritedTrackId]
      let trackFavoriteCount = favoriteCounts.tracks[favoritedTrackId]
      console.log(`User ${trackOwnerId}, track ${favoritedTrackId}, fave count ${trackFavoriteCount}`)
      for (var i = favoriteMilestoneList.length; i >= 0; i--) {
        let milestoneValue = favoriteMilestoneList[i]
        if (trackFavoriteCount >= milestoneValue) {
          console.log(`Track ${favoritedTrackId}, favorite count ${trackFavoriteCount} has met milestone ${milestoneValue}`)
          await this.processFavoriteMilestone(
            trackOwnerId,
            favoritedTrackId,
            actionEntityTypes.Track,
            milestoneValue,
            blocknumber,
            timestamp)
          break
        }
      }
    }

    for (var favoritedAlbumId of albumsFavorited) {
      let albumOwnerId = owners.albums[favoritedAlbumId]
      let albumFavoriteCount = favoriteCounts.albums[favoritedAlbumId]
      console.log(`User ${albumOwnerId}, album ${favoritedAlbumId}, fave count ${albumFavoriteCount}`)
      for (var j = favoriteMilestoneList.length; j >= 0; j--) {
        let milestoneValue = favoriteMilestoneList[j]
        if (albumFavoriteCount >= milestoneValue) {
          console.log(`Album ${favoritedAlbumId}, favorite count ${albumFavoriteCount} has met milestone ${milestoneValue}`)
          await this.processFavoriteMilestone(
            albumOwnerId,
            favoritedAlbumId,
            actionEntityTypes.Album,
            milestoneValue,
            blocknumber,
            timestamp)
          break
        }
      }
    }

    for (var favoritedPlaylistId of playlistsFavorited) {
      console.log(`Favorited playlist id: ${favoritedPlaylistId}`)
      let playlistOwnerId = owners.playlists[favoritedPlaylistId]
      let playlistFavoriteCount = favoriteCounts.playlists[favoritedPlaylistId]
      console.log(`User ${playlistOwnerId}, playlist ${favoritedPlaylistId}, fave count ${playlistFavoriteCount}`)
      for (var k = favoriteMilestoneList.length; k >= 0; k--) {
        let milestoneValue = favoriteMilestoneList[k]
        if (playlistFavoriteCount >= milestoneValue) {
          console.log(`Playlist ${favoritedPlaylistId}, favorite count ${playlistFavoriteCount} has met milestone ${milestoneValue}`)
          await this.processFavoriteMilestone(
            playlistOwnerId,
            favoritedPlaylistId,
            actionEntityTypes.Playlist,
            milestoneValue,
            blocknumber,
            timestamp)
          break
        }
      }
    }
  }

  async processFavoriteMilestone (userId, entityId, entityType, milestoneValue, blocknumber, timestamp) {
    await this.processMilestone(
      notificationTypes.MilestoneFavorite,
      userId,
      entityId,
      entityType,
      milestoneValue,
      blocknumber,
      timestamp)
  }

  async processRepostMilestone (userId, entityId, entityType, milestoneValue, blocknumber, timestamp) {
    await this.processMilestone(
      notificationTypes.MilestoneRepost,
      userId,
      entityId,
      entityType,
      milestoneValue,
      blocknumber,
      timestamp)
  }

  async processMilestone (milestoneType, userId, entityId, entityType, milestoneValue, blocknumber, timestamp) {
    let existingMilestoneQuery = await models.Notification.findAll({
      where: {
        userId: userId,
        type: milestoneType,
        entityId: entityId
      },
      include: [{
        model: models.NotificationAction,
        as: 'actions',
        where: {
          actionEntityType: entityType,
          actionEntityId: milestoneValue
        }
      }]
    })

    if (existingMilestoneQuery.length === 0) {
      let createMilestoneTx = await models.Notification.create({
        userId: userId,
        type: milestoneType,
        entityId: entityId,
        blocknumber,
        timestamp
      })
      let notificationId = createMilestoneTx.id
      let notifActionCreateTx = await models.NotificationAction.findOrCreate({
        where: {
          notificationId,
          actionEntityType: entityType,
          actionEntityId: milestoneValue
        }
      })

      // Destroy any unread milestone notifications of this type + entity
      let milestonesToBeDeleted = await models.Notification.findAll({
        where: {
          userId: userId,
          type: milestoneType,
          entityId: entityId,
          isRead: false
        },
        include: [{
          model: models.NotificationAction,
          as: 'actions',
          where: {
            actionEntityType: entityType,
            actionEntityId: {
              [models.Sequelize.Op.not]: milestoneValue
            }
          }
        }]
      })

      if (milestonesToBeDeleted) {
        console.log('To be deleted milestones:')
        for (var milestoneToDelete of milestonesToBeDeleted) {
          console.log(milestoneToDelete.id)
          let destroyTx = await models.NotificationAction.destroy({
            where: {
              notificationId: milestoneToDelete.id
            }
          })
          console.log(destroyTx)
          destroyTx = await models.Notification.destroy({
            where: {
              id: milestoneToDelete.id
            }
          })
          console.log(destroyTx)
        }
      }
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
    let milestones = body.data.milestones
    let owners = body.data.owners

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

    await this.indexMilestones(milestones, owners, metadata)
    return metadata.max_block_number
  }
}

module.exports = NotificationProcessor
