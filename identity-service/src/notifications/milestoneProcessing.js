const models = require('../models')
const { logger } = require('../logging')

const {
  notificationTypes,
  actionEntityTypes
} = require('./constants')
const { publish } = require('../awsSNS')
const { shouldNotifyUser } = require('./utils')

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

async function indexMilestones (milestones, owners, metadata, listenCounts, tx) {
  // Index follower milestones into notifications table
  let timestamp = new Date()
  let blocknumber = metadata.max_block_number

  // Index follower milestones
  await updateFollowerMilestones(milestones.follower_counts, blocknumber, timestamp, tx)

  // Index repost milestones
  await updateRepostMilestones(milestones.repost_counts, owners, blocknumber, timestamp)

  // Index favorite milestones
  await updateFavoriteMilestones(milestones.favorite_counts, owners, blocknumber, timestamp)

  // Index listens
  await updateTrackListenMilestones(listenCounts, blocknumber, timestamp)
}

/**
 *
 * Follower Milestones
 *
 */
async function updateFollowerMilestones (followerCounts, blocknumber, timestamp, tx) {
  let followersAddedDictionary = followerCounts
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

            // send push notification
            publish(`New Milestone: You have reached over ${milestoneValue} Followers 🎉🎉🎉`, targetUser, true)
          }
          logger.info(`User: ${targetUser} has met milestone value ${milestoneValue} followers`)
          break
        }
      }
    }
  }
}

/**
 *
 * Repost Milestones
 *
 */

async function updateRepostMilestones (repostCounts, owners, blocknumber, timestamp) {
  let tracksReposted = Object.keys(repostCounts.tracks)
  let albumsReposted = Object.keys(repostCounts.albums)
  let playlistsReposted = Object.keys(repostCounts.playlists)

  for (var repostedTrackId of tracksReposted) {
    let trackOwnerId = owners.tracks[repostedTrackId]
    let trackRepostCount = repostCounts.tracks[repostedTrackId]
    for (var i = repostMilestoneList.length; i >= 0; i--) {
      let milestoneValue = repostMilestoneList[i]
      if (trackRepostCount === milestoneValue) {
        await processRepostMilestone(
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
        await processRepostMilestone(
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
        await processRepostMilestone(
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

async function processRepostMilestone (userId, entityId, entityType, milestoneValue, blocknumber, timestamp) {
  await _processMilestone(
    notificationTypes.MilestoneRepost,
    userId,
    entityId,
    entityType,
    milestoneValue,
    blocknumber,
    timestamp)
}

/**
 *
 * Favorites Milestones
 *
 */

async function updateFavoriteMilestones (favoriteCounts, owners, blocknumber, timestamp) {
  let tracksFavorited = Object.keys(favoriteCounts.tracks)
  let albumsFavorited = Object.keys(favoriteCounts.albums)
  let playlistsFavorited = Object.keys(favoriteCounts.playlists)

  for (var favoritedTrackId of tracksFavorited) {
    let trackOwnerId = owners.tracks[favoritedTrackId]
    let trackFavoriteCount = favoriteCounts.tracks[favoritedTrackId]
    for (var i = favoriteMilestoneList.length; i >= 0; i--) {
      let milestoneValue = favoriteMilestoneList[i]
      if (trackFavoriteCount === milestoneValue) {
        await processFavoriteMilestone(
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
        await processFavoriteMilestone(
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
        await processFavoriteMilestone(
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

async function processFavoriteMilestone (userId, entityId, entityType, milestoneValue, blocknumber, timestamp) {
  await _processMilestone(
    notificationTypes.MilestoneFavorite,
    userId,
    entityId,
    entityType,
    milestoneValue,
    blocknumber,
    timestamp)
}

/**
 *
 * Listens Milestones
 *
 */

async function updateTrackListenMilestones (listenCounts, blocknumber, timestamp) {
  for (var entry of listenCounts) {
    let trackListenCount = Number.parseInt(entry.listenCount)
    for (var i = trackListenMilestoneList.length; i >= 0; i--) {
      let milestoneValue = trackListenMilestoneList[i]
      if (trackListenCount === milestoneValue || (trackListenCount >= milestoneValue && trackListenCount <= milestoneValue * 1.1)) {
        let trackId = entry.trackId
        let ownerId = entry.owner
        await processListenCountMilestone(
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

async function processListenCountMilestone (userId, entityId, entityType, milestoneValue, blocknumber, timestamp) {
  await _processMilestone(
    notificationTypes.MilestoneListen,
    userId,
    entityId,
    entityType,
    milestoneValue,
    blocknumber,
    timestamp)
}

async function _processMilestone (milestoneType, userId, entityId, entityType, milestoneValue, blocknumber, timestamp) {
  // Skip notification based on user configuration
  const { notifyMobile, notifyWeb } = await shouldNotifyUser(userId, 'milestonesAndAchievements')
  if (!notifyWeb && !notifyMobile) {
    return
  }

  if (notifyWeb) {
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

  if (notifyMobile) {
    publish(`New Milestone: Your ${entityType} reached over ${milestoneValue} ${milestoneType.replace('Milestone', '')}s 🎉🎉🎉`, userId, true)
  }
}

module.exports = {
  indexMilestones
}
