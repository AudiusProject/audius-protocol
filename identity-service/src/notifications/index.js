const Bull = require('bull')
const config = require('../config.js')
const models = require('../models')
const axios = require('axios')
const moment = require('moment-timezone')
const fs = require('fs')
const path = require('path')
const uuidv4 = require('uuid/v4')
const getEmailNotifications = require('./fetchNotificationMetadata')
const renderEmail = require('./renderEmail')
const { logger } = require('../logging')

const notificationTypes = Object.freeze({
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
  MilestoneFavorite: 'MilestoneFavorite',
  MilestoneListen: 'MilestoneListen',
  Announcement: 'Announcement'
})

const actionEntityTypes = Object.freeze({
  User: 'User',
  Track: 'Track',
  Album: 'Album',
  Playlist: 'Playlist'
})

const notificationJobType = 'notificationProcessJob'

const dayInHours = 24
const weekInHours = 168

// Base milestone list shared across all types
// Each type can be configured as needed
const baseMilestoneList = [10, 25, 50, 100, 250, 500, 1000]
const followerMilestoneList = baseMilestoneList
// Repost milestone list shared across tracks/albums/playlists
const repostMilestoneList = baseMilestoneList
// Favorite milestone list shared across tracks/albums/playlists
const favoriteMilestoneList = baseMilestoneList
// Track listen milestone list
const trackListenMilestoneList = baseMilestoneList

const notifDiscProv = config.get('notificationDiscoveryProvider')
const emailCachePath = './emailCache'

class NotificationProcessor {
  constructor () {
    this.notifQueue = new Bull(
      'notification-queue',
      { redis:
        { port: config.get('redisPort'), host: config.get('redisHost') }
      })
    this.emailQueue = new Bull(
      'email-queue',
      { redis:
        { port: config.get('redisPort'), host: config.get('redisHost') }
      })
    this.startBlock = config.get('notificationStartBlock')
    this.blockchainIdsPopulated = false
  }

  async init (audiusLibs, expressApp, redis) {
    // Clear any pending notif jobs
    await this.notifQueue.empty()
    await this.emailQueue.empty()

    this.audiusLibs = audiusLibs
    this.expressApp = expressApp
    this.redis = redis
    this.mg = this.expressApp.get('mailgun')

    // Index all blockchain ids
    await this.updateBlockchainIds()

    // Notification processing job
    // Indexes network notifications
    this.notifQueue.process(async (job, done) => {
      let minBlock = job.data.minBlock
      if (!minBlock && minBlock !== 0) throw new Error('no min block')

      // Re-enable for development as needed
      // this.emailQueue.add({ type: 'unreadEmailJob' })

      try {
        // Index notifications
        let maxBlockNumber = await this.indexNotifications(minBlock)

        // Update cached max block number
        await this.redis.set('maxBlockNumber', maxBlockNumber)

        // Restart job with updated startBlock
        await this.notifQueue.add({
          type: notificationJobType,
          minBlock: maxBlockNumber
        })
      } catch (e) {
        logger.error(`Restarting due to error indexing notifications : ${e}`)
        // Restart job with same startBlock
        await this.notifQueue.add({
          type: notificationJobType,
          minBlock: minBlock
        })
      }
      // Delay 3s
      await new Promise(resolve => setTimeout(resolve, 3000))

      done()
    })

    // Email notification queue
    this.emailQueue.process(async (job, done) => {
      await this.processEmailNotifications()
      done()
    })

    if (!fs.existsSync(emailCachePath)) {
      fs.mkdirSync(emailCachePath)
    }

    // Every hour cron: '0 * * * *'
    this.emailQueue.add(
      { type: 'unreadEmailJob' },
      { repeat: { cron: '0 * * * *' } }
    )

    let startBlock = await this.getHighestBlockNumber()
    logger.info(`Starting with ${startBlock}`)
    await this.notifQueue.add({
      minBlock: startBlock,
      type: notificationJobType
    })
  }

  async getHighestBlockNumber () {
    let highestBlockNumber = await models.NotificationAction.max('blocknumber')
    if (!highestBlockNumber) {
      highestBlockNumber = this.startBlock
    }
    let date = new Date()
    logger.info(`Highest block: ${highestBlockNumber} - ${date}`)
    return highestBlockNumber
  }

  async calculateTrackListenMilestones () {
    // Select last 10 distinct tracks with listens
    let recentListenCountQuery = {
      attributes: [[models.Sequelize.col('trackId'), 'trackId'], [models.Sequelize.fn('max', models.Sequelize.col('hour')), 'hour']],
      order: [[models.Sequelize.col('hour'), 'DESC']],
      group: ['trackId'],
      limit: 10
    }

    // Distinct tracks
    let res = await models.TrackListenCount.findAll(recentListenCountQuery)
    let tracksListenedTo = res.map((listenEntry) => listenEntry.trackId)

    // Total listens query
    let totalListens = {
      attributes: [
        [models.Sequelize.col('trackId'), 'trackId'],
        [
          models.Sequelize.fn('date_trunc', 'millennium', models.Sequelize.col('hour')),
          'date'
        ],
        [models.Sequelize.fn('sum', models.Sequelize.col('listens')), 'listens']
      ],
      group: ['trackId', 'date'],
      order: [[models.Sequelize.col('listens'), 'DESC']],
      where: {
        trackId: { [models.Sequelize.Op.in]: tracksListenedTo }
      }
    }

    // Map of listens
    let totalListenQuery = await models.TrackListenCount.findAll(totalListens)
    let processedTotalListens = totalListenQuery.map((x) => {
      return { trackId: x.trackId, listenCount: x.listens }
    })

    return processedTotalListens
  }

  async indexMilestones (milestones, owners, metadata, listenCounts, tx) {
    // Index follower milestones into notifications table
    let followersAddedDictionary = milestones.follower_counts
    let timestamp = new Date()
    let blocknumber = metadata.max_block_number
    let usersWithNewFollowers = Object.keys(followersAddedDictionary)

    // Parse follower milestones
    for (var targetUser of usersWithNewFollowers) {
      if (followersAddedDictionary.hasOwnProperty(targetUser)) {
        let currentFollowerCount = followersAddedDictionary[targetUser]
        for (var i = followerMilestoneList.length; i >= 0; i--) {
          let milestoneValue = followerMilestoneList[i]
          if (currentFollowerCount === milestoneValue) {
            let existingFollowMilestoneQuery = await models.Notification.findAll({
              where: {
                userId: targetUser,
                type: notificationTypes.MilestoneFollow,
                entityId: milestoneValue
              },
              include: [{
                model: models.NotificationAction,
                as: 'actions'
              }],
              transaction: tx
            })
            if (existingFollowMilestoneQuery.length === 0) {
              // MilestoneFollow
              // userId=user achieving milestone
              // entityId=milestoneValue, number of followers
              // actionEntityType=User
              // actionEntityId=milestoneValue, number of followers
              let createMilestoneTx = await models.Notification.create({
                userId: targetUser,
                type: notificationTypes.MilestoneFollow,
                entityId: milestoneValue,
                blocknumber,
                timestamp
              }, { transaction: tx })
              // Note that milestoneValue is the newly met milestone count in Notifications/NotificationActions
              let notificationId = createMilestoneTx.id
              await models.NotificationAction.findOrCreate({
                where: {
                  notificationId: notificationId,
                  actionEntityType: actionEntityTypes.User,
                  actionEntityId: milestoneValue,
                  blocknumber
                },
                transaction: tx
              })
            }
            logger.info(`User: ${targetUser} has met milestone value ${milestoneValue} followers`)
            break
          }
        }
      }
    }

    // Index repost milestones
    await this.updateRepostMilestones(milestones.repost_counts, owners, blocknumber, timestamp)

    // Index favorite milestones
    await this.updateFavoriteMilestones(milestones.favorite_counts, owners, blocknumber, timestamp)

    // Index listens
    await this.updateTrackListenMilestones(listenCounts, owners, blocknumber, timestamp)
  }

  async updateTrackListenMilestones (listenCounts, owners, blocknumber, timestamp) {
    for (var entry of listenCounts) {
      let trackListenCount = Number.parseInt(entry.listenCount)
      for (var i = trackListenMilestoneList.length; i >= 0; i--) {
        let milestoneValue = trackListenMilestoneList[i]
        if (trackListenCount === milestoneValue || (trackListenCount >= milestoneValue && trackListenCount <= milestoneValue * 1.1)) {
          let trackId = entry.trackId
          let ownerId = entry.owner
          await this.processListenCountMilestone(
            ownerId,
            trackId,
            actionEntityTypes.Track,
            milestoneValue,
            blocknumber,
            timestamp
          )
          break
        }
      }
    }
  }

  async updateRepostMilestones (repostCounts, owners, blocknumber, timestamp) {
    let tracksReposted = Object.keys(repostCounts.tracks)
    let albumsReposted = Object.keys(repostCounts.albums)
    let playlistsReposted = Object.keys(repostCounts.playlists)

    for (var repostedTrackId of tracksReposted) {
      let trackOwnerId = owners.tracks[repostedTrackId]
      let trackRepostCount = repostCounts.tracks[repostedTrackId]
      for (var i = repostMilestoneList.length; i >= 0; i--) {
        let milestoneValue = repostMilestoneList[i]
        if (trackRepostCount === milestoneValue) {
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
      for (var j = repostMilestoneList.length; j >= 0; j--) {
        let milestoneValue = repostMilestoneList[j]
        if (albumRepostCount === milestoneValue) {
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
      for (var k = repostMilestoneList.length; k >= 0; k--) {
        let milestoneValue = repostMilestoneList[k]
        if (playlistRepostCount === milestoneValue) {
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
      for (var i = favoriteMilestoneList.length; i >= 0; i--) {
        let milestoneValue = favoriteMilestoneList[i]
        if (trackFavoriteCount === milestoneValue) {
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
      for (var j = favoriteMilestoneList.length; j >= 0; j--) {
        let milestoneValue = favoriteMilestoneList[j]
        if (albumFavoriteCount === milestoneValue) {
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
      let playlistOwnerId = owners.playlists[favoritedPlaylistId]
      let playlistFavoriteCount = favoriteCounts.playlists[favoritedPlaylistId]
      for (var k = favoriteMilestoneList.length; k >= 0; k--) {
        let milestoneValue = favoriteMilestoneList[k]
        if (playlistFavoriteCount === milestoneValue) {
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

  async processListenCountMilestone (userId, entityId, entityType, milestoneValue, blocknumber, timestamp) {
    await this.processMilestone(
      notificationTypes.MilestoneListen,
      userId,
      entityId,
      entityType,
      milestoneValue,
      blocknumber,
      timestamp)
  }

  async processMilestone (milestoneType, userId, entityId, entityType, milestoneValue, blocknumber, timestamp) {
    // Skip notification based on user configuration
    let userNotifSettings = await models.UserNotificationSettings.findOrCreate(
      { where: { userId } }
    )
    if (!userNotifSettings[0].milestonesAndAchievements) { return }

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
      // MilestoneListen/Favorite/Repost
      // userId=user achieving milestone
      // entityId=Entity reaching milestone, one of track/collection
      // actionEntityType=Entity achieving milestone, can be track/collection
      // actionEntityId=Milestone achieved
      let createMilestoneTx = await models.Notification.create({
        userId: userId,
        type: milestoneType,
        entityId: entityId,
        blocknumber,
        timestamp
      })
      let notificationId = createMilestoneTx.id
      await models.NotificationAction.findOrCreate({
        where: {
          notificationId,
          actionEntityType: entityType,
          actionEntityId: milestoneValue,
          blocknumber
        }
      })
      logger.info(`Process milestone ${userId}, type ${milestoneType}, entityId ${entityId}, type ${entityType}, milestoneValue ${milestoneValue}`)

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
        for (var milestoneToDelete of milestonesToBeDeleted) {
          logger.info(`Deleting milestone: ${milestoneToDelete.id}`)
          let destroyTx = await models.NotificationAction.destroy({
            where: {
              notificationId: milestoneToDelete.id
            }
          })
          logger.info(destroyTx)
          destroyTx = await models.Notification.destroy({
            where: {
              id: milestoneToDelete.id
            }
          })
          logger.info(destroyTx)
        }
      }
    }
  }

  async indexNotifications (minBlock) {
    logger.info(`${new Date()} - indexNotifications job`)

    // Query owners for tracks relevant to track listen counts
    let listenCounts = await this.calculateTrackListenMilestones()
    let trackIdOwnersToRequestList = listenCounts.map(x => x.trackId)

    // These track_id get parameters will be used to retrieve track owner info
    // This is required since there is no guarantee that there are indeed notifications for this user
    // The owner info is then used to target listenCount milestone notifications
    let params = new URLSearchParams()
    trackIdOwnersToRequestList.forEach((x) => { params.append('track_id', x) })
    params.append('min_block_number', minBlock)

    let reqObj = {
      method: 'get',
      url: `${notifDiscProv}/notifications`,
      params: params,
      timeout: 10000
    }
    // Use a single transaction
    const tx = await models.sequelize.transaction()

    let body = (await axios(reqObj)).data
    let metadata = body.data.info
    let notifications = body.data.notifications
    let milestones = body.data.milestones
    let owners = body.data.owners

    try {
      for (let notif of notifications) {
        // blocknumber + timestamp parsed for all notification types
        let blocknumber = notif.blocknumber
        let timestamp = Date.parse(notif.timestamp.slice(0, -2))

        // Handle the 'follow' notification type
        if (notif.type === notificationTypes.Follow) {
          let notificationTarget = notif.metadata.followee_user_id
          // Skip notification based on user settings
          let userNotifSettings = await models.UserNotificationSettings.findOne(
            { where: { userId: notificationTarget }, transaction: tx }
          )
          if (userNotifSettings && !userNotifSettings.followers) {
            continue
          }

          let notificationInitiator = notif.metadata.follower_user_id
          let unreadQuery = await models.Notification.findAll({
            where: {
              isViewed: false,
              userId: notificationTarget,
              type: notificationTypes.Follow
            },
            transaction: tx
          })

          let notificationId = null
          // Insertion into the Notification table
          // Follow - userId = notif target, entityId=null, actionEntityId = user who followed target
          if (unreadQuery.length === 0) {
            let createNotifTx = await models.Notification.create({
              type: notificationTypes.Follow,
              isViewed: false,
              isRead: false,
              isHidden: false,
              userId: notificationTarget,
              blocknumber: blocknumber,
              timestamp: timestamp
            }, { transaction: tx })
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
                actionEntityId: notificationInitiator,
                blocknumber
              },
              transaction: tx
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
                plain: true,
                transaction: tx
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
              throw new Error('Invalid repost type')
          }
          let notificationTarget = notif.metadata.entity_owner_id

          // Skip notification based on user settings
          let userNotifSettings = await models.UserNotificationSettings.findOne(
            { where: { userId: notificationTarget }, transaction: tx }
          )
          if (userNotifSettings && !userNotifSettings.reposts) {
            continue
          }

          let notificationEntityId = notif.metadata.entity_id
          let notificationInitiator = notif.initiator

          let unreadQuery = await models.Notification.findAll({
            where: {
              isViewed: false,
              userId: notificationTarget,
              type: repostType,
              entityId: notificationEntityId
            },
            transaction: tx
          })

          let notificationId = null
          // Insert new notification
          // Repost - userId=notif target, entityId=track/album/repost id, actionEntityType=User actionEntityId=user who reposted
          // As multiple users repost an entity, NotificationActions are added matching the NotificationId
          if (unreadQuery.length === 0) {
            let repostNotifTx = await models.Notification.create({
              type: repostType,
              isRead: false,
              isHidden: false,
              isViewed: false,
              userId: notificationTarget,
              entityId: notificationEntityId,
              blocknumber,
              timestamp
            }, { transaction: tx })
            notificationId = repostNotifTx.id
          } else {
            notificationId = unreadQuery[0].id
          }

          if (notificationId) {
            let notifActionCreateTx = await models.NotificationAction.findOrCreate({
              where: {
                notificationId: notificationId,
                actionEntityType: actionEntityTypes.User,
                actionEntityId: notificationInitiator,
                blocknumber
              },
              transaction: tx
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
                plain: true,
                transaction: tx
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
              throw new Error('Invalid favorite type')
          }
          let notificationTarget = notif.metadata.entity_owner_id
          // Skip notification based on user settings
          let userNotifSettings = await models.UserNotificationSettings.findOne(
            { where: { userId: notificationTarget }, transaction: tx }
          )
          if (userNotifSettings && !userNotifSettings.favorites) {
            continue
          }

          let notificationEntityId = notif.metadata.entity_id
          let notificationInitiator = notif.initiator
          let unreadQuery = await models.Notification.findAll({
            where: {
              isViewed: false,
              userId: notificationTarget,
              type: favoriteType,
              entityId: notificationEntityId
            },
            transaction: tx
          })

          let notificationId = null
          if (unreadQuery.length === 0) {
          // Favorite - userId=notif target, entityId=track/album/repost id, actionEntityType=User actionEntityId=user who favorited
          // As multiple users favorite an entity, NotificationActions are added matching the NotificationId
            let favoriteNotifTx = await models.Notification.create({
              type: favoriteType,
              isViewed: false,
              isRead: false,
              isHidden: false,
              userId: notificationTarget,
              entityId: notificationEntityId,
              blocknumber,
              timestamp
            }, { transaction: tx })
            notificationId = favoriteNotifTx.id
          } else {
            notificationId = unreadQuery[0].id
          }

          if (notificationId) {
            let notifActionCreateTx = await models.NotificationAction.findOrCreate({
              where: {
                notificationId: notificationId,
                actionEntityType: actionEntityTypes.User,
                actionEntityId: notificationInitiator,
                blocknumber
              },
              transaction: tx
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
                plain: true,
                transaction: tx
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
              throw new Error('Invalid create type')
          }

          // Query user IDs from subscriptions table
          // Notifications go to all users subscribing to this track uploader
          let subscribers = await models.Subscription.findAll({
            where: {
              userId: notif.initiator
            },
            transaction: tx
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

          // Create notification for each subscriber
          await Promise.all(subscribers.map(async (s) => {
            // Add notification for this user indicating the uploader has added a track
            let notificationTarget = s.subscriberId

            let unreadQuery = await models.Notification.findAll({
              where: {
                isViewed: false,
                userId: notificationTarget,
                type: createType,
                entityId: notificationEntityId
              },
              transaction: tx
            })

            let notificationId = null
            if (unreadQuery.length === 0) {
              let createTrackNotifTx = await models.Notification.create({
                isViewed: false,
                isRead: false,
                isHidden: false,
                userId: notificationTarget,
                type: createType,
                entityId: notificationEntityId,
                blocknumber,
                timestamp
              }, { transaction: tx })
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
                  actionEntityId: createdActionEntityId,
                  blocknumber
                },
                transaction: tx
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
                  plain: true,
                  transaction: tx
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
                await models.NotificationAction.destroy({
                  where: {
                    actionEntityType: actionEntityTypes.Track,
                    actionEntityId: trackId
                  }
                }, { transaction: tx })
              }
            }
          }
        }
      }

      // Populate owners, used to index in milestone generation
      listenCounts = listenCounts.map((x) => {
        return {
          trackId: x.trackId,
          listenCount: x.listenCount,
          owner: owners.tracks[x.trackId]
        }
      })

      await this.indexMilestones(milestones, owners, metadata, listenCounts, tx)

      // Commit
      await tx.commit()
    } catch (e) {
      logger.error(`Error indexing notification ${e}`)
      logger.error(e.stack)
      await tx.rollback()
    }
    return metadata.max_block_number
  }

  async updateBlockchainIds () {
    // For any users missing blockchain id, here we query from the disc prov and fill in values
    let usersWithoutBlockchainId = await models.User.findAll({
      attributes: ['walletAddress', 'handle'],
      where: { blockchainUserId: null }
    })
    for (let updateUser of usersWithoutBlockchainId) {
      try {
        let walletAddress = updateUser.walletAddress
        logger.info(`Updating user with wallet ${walletAddress}`)
        const response = await axios({
          method: 'get',
          url: `${notifDiscProv}/users`,
          params: {
            wallet: walletAddress
          }
        })
        if (response.data.data.length === 1) {
          let respUser = response.data.data[0]
          let missingUserId = respUser.user_id
          let missingHandle = respUser.handle
          let updateObject = { blockchainUserId: missingUserId }

          if (updateUser.handle === null) {
            updateObject['handle'] = missingHandle
          }
          await models.User.update(
            updateObject,
            { where: { walletAddress } }
          )
          logger.info(`Updated wallet ${walletAddress} to blockchainUserId: ${missingUserId}, ${updateUser.handle}`)
          continue
        }
        for (let respUser of response.data.data) {
          // Only update if handles match
          if (respUser.handle === updateUser.handle) {
            let missingUserId = respUser.user_id
            await models.User.update(
              { blockchainUserId: missingUserId },
              { where: { walletAddress, handle: updateUser.handle } }
            )
            logger.info(`Updated wallet ${walletAddress} to blockchainUserId: ${missingUserId}, ${updateUser.handle}`)
            await models.UserNotificationSettings.findOrCreate({ where: { userId: missingUserId } })
          }
        }
      } catch (e) {
        logger.error(e)
      }
    }
  }

  async processEmailNotifications () {
    try {
      logger.info(`${new Date()} - processEmailNotifications`)

      let mg = this.expressApp.get('mailgun')
      if (mg === null) {
        logger.error('Mailgun not configured')
        return
      }

      let dailyEmailUsers = await models.UserNotificationSettings.findAll({
        attributes: ['userId'],
        where: { emailFrequency: 'daily' }
      }).map(x => x.userId)

      let weeklyEmailUsers = await models.UserNotificationSettings.findAll({
        attributes: ['userId'],
        where: { emailFrequency: 'weekly' }
      }).map(x => x.userId)

      let now = moment()
      let dayAgo = now.clone().subtract(1, 'days')
      let weekAgo = now.clone().subtract(7, 'days')

      let appAnnouncements = this.expressApp.get('announcements')
      // For each announcement, we generate a list of valid users
      // Based on the user's email frequency
      let dailyUsersWithPendingAnnouncements = []
      let weeklyUsersWithPendingAnnouncements = []
      let currentTime = moment.utc()
      for (var announcement of appAnnouncements) {
        let announcementDate = moment(announcement['datePublished'])
        let timeSinceAnnouncement = moment.duration(currentTime.diff(announcementDate)).asHours()
        let announcementEntityId = announcement['entityId']
        let id = announcement['id']
        let usersCreatedAfterAnnouncement = await models.User.findAll({
          attributes: ['blockchainUserId'],
          where: {
            createdAt: { [models.Sequelize.Op.lt]: moment(announcementDate) }
          }
        }).map(x => x.blockchainUserId)

        for (var user of usersCreatedAfterAnnouncement) {
          let userNotificationQuery = await models.Notification.findOne({
            where: {
              isViewed: true,
              userId: user,
              type: notificationTypes.Announcement,
              entityId: announcementEntityId
            }
          })
          if (userNotificationQuery) {
            continue
          }
          if (dailyEmailUsers.includes(user)) {
            if (timeSinceAnnouncement < (dayInHours * 1.5)) {
              logger.info(`Announcements - ${id} | Daily user ${user}, <1 day`)
              dailyUsersWithPendingAnnouncements.append(user)
            }
          } else if (weeklyEmailUsers.includes(user)) {
            if (timeSinceAnnouncement < (weekInHours * 1.5)) {
              logger.info(`Announcements - ${id} | Weekly user ${user}, <1 week`)
              weeklyUsersWithPendingAnnouncements.append(user)
            }
          }
        }
      }
      let pendingNotificationUsers = new Set()
      // Add users with pending announcement notifications
      dailyUsersWithPendingAnnouncements.forEach(
        item => pendingNotificationUsers.add(item))
      weeklyUsersWithPendingAnnouncements.forEach(
        item => pendingNotificationUsers.add(item))

      // Query users with pending notifications grouped by frequency
      let dailyEmailUsersWithUnseeenNotifications = await models.Notification.findAll({
        attributes: ['userId'],
        where: {
          isViewed: false,
          userId: { [models.Sequelize.Op.in]: dailyEmailUsers },
          timestamp: { [models.Sequelize.Op.gt]: dayAgo }
        },
        group: ['userId']
      }).map(x => x.userId)
      dailyEmailUsersWithUnseeenNotifications.forEach(item => pendingNotificationUsers.add(item))

      let weeklyEmailUsersWithUnseeenNotifications = await models.Notification.findAll({
        attributes: ['userId'],
        where: {
          isViewed: false,
          userId: { [models.Sequelize.Op.in]: weeklyEmailUsers },
          timestamp: { [models.Sequelize.Op.gt]: weekAgo }
        },
        group: ['userId']
      }).map(x => x.userId)
      weeklyEmailUsersWithUnseeenNotifications.forEach(item => pendingNotificationUsers.add(item))
      logger.info(`Daily Email Users: ${dailyEmailUsersWithUnseeenNotifications}`)
      logger.info(`Weekly Email Users: ${weeklyEmailUsersWithUnseeenNotifications}`)

      // All users with notifications, including announcements
      let allUsersWithUnseenNotifications = [...pendingNotificationUsers]
      logger.info(`All Pending Email Users: ${allUsersWithUnseenNotifications}`)

      let userInfo = await models.User.findAll({
        where: {
          blockchainUserId: {
            [models.Sequelize.Op.in]: allUsersWithUnseenNotifications
          }
        }
      })

      // For every user with pending notifications, check if they are in the right timezone
      for (let userToEmail of userInfo) {
        let userEmail = userToEmail.email
        let userId = userToEmail.blockchainUserId
        let timezone = userToEmail.timezone
        if (!timezone) {
          timezone = 'America/Los_Angeles'
        }
        let userSettings = await models.UserNotificationSettings.findOrCreate(
          { where: { userId } }
        )
        let frequency = userSettings[0].emailFrequency
        if (frequency === 'off') {
          logger.info(`Bypassing email for user ${userId}`)
          continue
        }
        let currentUtcTime = moment.utc()
        let userTime = currentUtcTime.tz(timezone)
        let startOfUserDay = userTime.clone().startOf('day')
        let difference = moment.duration(userTime.diff(startOfUserDay)).asHours()

        // Based on this difference, schedule email for users
        // In prod, this difference must be <1 hour or between midnight - 1am
        let maxHourDifference = 2 // 1.5
        // Valid time found
        if (difference < maxHourDifference) {
          logger.info(`Valid email period for user ${userId}, ${timezone}, ${difference} hrs since startOfDay`)
          let latestUserEmail = await models.NotificationEmail.findOne({
            where: {
              userId
            },
            order: [['timestamp', 'DESC']]
          })
          if (!latestUserEmail) {
            let sent = await this.renderAndSendEmail(
              userId,
              userEmail,
              appAnnouncements,
              frequency,
              frequency === 'daily' ? dayAgo : weekAgo
            )
            if (!sent) { continue }
            logger.info(`First email for ${userId}, ${frequency}, ${currentUtcTime}`)
            await models.NotificationEmail.create({
              userId,
              emailFrequency: frequency,
              timestamp: currentUtcTime
            })
          } else {
            let lastSentTimestamp = moment(latestUserEmail.timestamp)
            let timeSinceEmail = moment.duration(currentUtcTime.diff(lastSentTimestamp)).asHours()
            if (frequency === 'daily') {
              // If 1 day has passed, send email
              if (timeSinceEmail >= (dayInHours - 1)) {
                logger.info(`Daily email to ${userId}, last email from ${lastSentTimestamp}`)
                // Render email
                let sent = await this.renderAndSendEmail(
                  userId,
                  userEmail,
                  appAnnouncements,
                  frequency,
                  dayAgo
                )
                if (!sent) { continue }

                await models.NotificationEmail.create({
                  userId,
                  emailFrequency: frequency,
                  timestamp: currentUtcTime
                })
              }
            } else if (frequency === 'weekly') {
              // If ~1 week has passed, send email
              if (timeSinceEmail >= (weekInHours - 1)) {
                logger.info(`Weekly email to ${userId}, last email from ${lastSentTimestamp}`)
                // Render email
                let sent = await this.renderAndSendEmail(
                  userId,
                  userEmail,
                  appAnnouncements,
                  frequency,
                  weekAgo
                )
                if (!sent) { continue }
                await models.NotificationEmail.create({
                  userId,
                  emailFrequency: frequency,
                  timestamp: currentUtcTime
                })
              }
            }
          }
        }
      }
    } catch (e) {
      logger.error('Error processing email notifications')
      logger.error(e)
    }
  }

  // Master function to render and send email for a given userId
  async renderAndSendEmail (
    userId,
    userEmail,
    announcements,
    frequency,
    startTime
  ) {
    try {
      logger.info(`renderAndSendEmail ${userId}, ${userEmail}, ${frequency}, from ${startTime}`)
      const [notificationProps, notificationCount] = await getEmailNotifications(
        this.audiusLibs,
        userId,
        announcements,
        startTime,
        5)
      const emailSubject = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''} on Audius`
      if (notificationCount === 0) {
        logger.info(`renderAndSendEmail - 0 notifications detected for user ${userId}, bypassing email`)
        return
      }

      let renderProps = {}
      renderProps['notifications'] = notificationProps
      if (frequency === 'daily') {
        renderProps['title'] = `Daily Email - ${userEmail}`
      } else if (frequency === 'weekly') {
        renderProps['title'] = `Weekly Email - ${userEmail}`
      }

      let now = moment()
      let dayAgo = now.clone().subtract(1, 'days')
      let weekAgo = now.clone().subtract(7, 'days')
      let formattedDayAgo = dayAgo.format('MMMM Do YYYY')
      let shortWeekAgoFormat = weekAgo.format('MMMM Do')
      let weeklySubjectFormat = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''} from ${shortWeekAgoFormat} - ${formattedDayAgo}`
      let dailySubjectFormat = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''} from ${formattedDayAgo}`

      const subject = frequency === 'daily' ? dailySubjectFormat : weeklySubjectFormat
      renderProps['subject'] = subject
      const notifHtml = renderEmail(renderProps)

      const emailParams = {
        from: 'Audius <notify@audius.co>',
        to: `${userEmail}`,
        bcc: 'audius-email-test@audius.co',
        html: notifHtml,
        subject: emailSubject
      }

      // Send email
      await this.sendEmail(emailParams)

      // Cache on file system
      await this.cacheEmail({ renderProps, emailParams })

      return true
    } catch (e) {
      logger.error(`Error in renderAndSendEmail ${e}`)
      return false
    }
  }

  async cacheEmail (cacheParams) {
    try {
      let uuid = uuidv4()
      let timestamp = moment().valueOf()
      let fileName = `${uuid}-${timestamp.toString()}.json`
      let filePath = path.join(emailCachePath, fileName)
      await new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(cacheParams), (error) => {
          if (error) {
            reject(error)
          }
          resolve()
        })
      })
    } catch (e) {
      logger.error(`Error in cacheEmail ${e}`)
    }
  }

  async sendEmail (emailParams) {
    return new Promise((resolve, reject) => {
      if (this.mg === null) {
        resolve()
      }
      this.mg.messages().send(emailParams, (error, body) => {
        if (error) {
          reject(error)
        }
        resolve(body)
      })
    })
  }
}

module.exports = NotificationProcessor
