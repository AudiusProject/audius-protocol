const models = require('../models')
const { logger } = require('../logging')

const {
  deviceType,
  notificationTypes,
  actionEntityTypes
} = require('./constants')
const { publish } = require('./notificationQueue')
const { shouldNotifyUser } = require('./utils')
const { fetchNotificationMetadata } = require('./fetchNotificationMetadata')
const {
  notificationResponseMap,
  notificationResponseTitleMap,
  pushNotificationMessagesMap
} = require('./formatNotificationMetadata')

// Base milestone list shared across all types
// Each type can be configured as needed
const baseMilestoneList = [10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000]
const followerMilestoneList = baseMilestoneList
// Repost milestone list shared across tracks/albums/playlists
const repostMilestoneList = baseMilestoneList
// Favorite milestone list shared across tracks/albums/playlists
const favoriteMilestoneList = baseMilestoneList
// Track listen milestone list
const trackListenMilestoneList = baseMilestoneList

async function indexMilestones (milestones, owners, metadata, listenCounts, audiusLibs, tx) {
  // Index follower milestones into notifications table
  let timestamp = new Date()
  let blocknumber = metadata.max_block_number

  // Index follower milestones
  await updateFollowerMilestones(milestones.follower_counts, blocknumber, timestamp, audiusLibs, tx)

  // Index repost milestones
  await updateRepostMilestones(milestones.repost_counts, owners, blocknumber, timestamp, audiusLibs, tx)

  // Index favorite milestones
  await updateFavoriteMilestones(milestones.favorite_counts, owners, blocknumber, timestamp, audiusLibs, tx)
}

/**
 *
 * Follower Milestones
 *
 */
async function updateFollowerMilestones (followerCounts, blocknumber, timestamp, audiusLibs, tx) {
  let followersAddedDictionary = followerCounts
  let usersWithNewFollowers = Object.keys(followersAddedDictionary)
  const followerMilestoneNotificationType = notificationTypes.MilestoneFollow
  // Parse follower milestones
  for (var targetUser of usersWithNewFollowers) {
    if (followersAddedDictionary.hasOwnProperty(targetUser)) {
      let currentFollowerCount = followersAddedDictionary[targetUser]
      for (var i = followerMilestoneList.length; i >= 0; i--) {
        let milestoneValue = followerMilestoneList[i]
        if (currentFollowerCount === milestoneValue) {
          // MilestoneFollow
          // userId=user achieving milestone
          // entityId=milestoneValue, number of followers
          // actionEntityType=User
          // actionEntityId=milestoneValue, number of followers
          await _processMilestone(
            followerMilestoneNotificationType,
            targetUser,
            milestoneValue,
            actionEntityTypes.User,
            milestoneValue,
            blocknumber,
            timestamp,
            audiusLibs,
            tx)
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
async function updateRepostMilestones (repostCounts, owners, blocknumber, timestamp, audiusLibs, tx) {
  let tracksReposted = Object.keys(repostCounts.tracks)
  let albumsReposted = Object.keys(repostCounts.albums)
  let playlistsReposted = Object.keys(repostCounts.playlists)
  const repostMilestoneNotificationType = notificationTypes.MilestoneRepost

  for (var repostedTrackId of tracksReposted) {
    let trackOwnerId = owners.tracks[repostedTrackId]
    let trackRepostCount = repostCounts.tracks[repostedTrackId]
    for (var i = repostMilestoneList.length; i >= 0; i--) {
      let milestoneValue = repostMilestoneList[i]
      if (trackRepostCount === milestoneValue) {
        await _processMilestone(
          repostMilestoneNotificationType,
          trackOwnerId,
          repostedTrackId,
          actionEntityTypes.Track,
          milestoneValue,
          blocknumber,
          timestamp,
          audiusLibs,
          tx
        )
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
        await _processMilestone(
          repostMilestoneNotificationType,
          albumOwnerId,
          repostedAlbumId,
          actionEntityTypes.Album,
          milestoneValue,
          blocknumber,
          timestamp,
          audiusLibs,
          tx
        )
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
        await _processMilestone(
          repostMilestoneNotificationType,
          playlistOwnerId,
          repostedPlaylistId,
          actionEntityTypes.Playlist,
          milestoneValue,
          blocknumber,
          timestamp,
          audiusLibs,
          tx
        )
        break
      }
    }
  }
}

/**
 *
 * Favorites Milestones
 *
 */
async function updateFavoriteMilestones (favoriteCounts, owners, blocknumber, timestamp, audiusLibs, tx) {
  let tracksFavorited = Object.keys(favoriteCounts.tracks)
  let albumsFavorited = Object.keys(favoriteCounts.albums)
  let playlistsFavorited = Object.keys(favoriteCounts.playlists)
  const favoriteMilestoneNotificationType = notificationTypes.MilestoneFavorite

  for (var favoritedTrackId of tracksFavorited) {
    let trackOwnerId = owners.tracks[favoritedTrackId]
    let trackFavoriteCount = favoriteCounts.tracks[favoritedTrackId]
    for (var i = favoriteMilestoneList.length; i >= 0; i--) {
      let milestoneValue = favoriteMilestoneList[i]
      if (trackFavoriteCount === milestoneValue) {
        await _processMilestone(
          favoriteMilestoneNotificationType,
          trackOwnerId,
          favoritedTrackId,
          actionEntityTypes.Track,
          milestoneValue,
          blocknumber,
          timestamp,
          audiusLibs,
          tx
        )
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
        await _processMilestone(
          favoriteMilestoneNotificationType,
          albumOwnerId,
          favoritedAlbumId,
          actionEntityTypes.Album,
          milestoneValue,
          blocknumber,
          timestamp,
          audiusLibs,
          tx
        )
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
        await _processMilestone(
          favoriteMilestoneNotificationType,
          playlistOwnerId,
          favoritedPlaylistId,
          actionEntityTypes.Playlist,
          milestoneValue,
          blocknumber,
          timestamp,
          audiusLibs,
          tx
        )
        break
      }
    }
  }
}

/**
 *
 * Listens Milestones
 *
 */
async function updateTrackListenMilestones (listenCounts, blocknumber, timestamp, audiusLibs, tx) { // eslint-disable-line no-unused-vars
  const listensMilestoneNotificationType = notificationTypes.MilestoneListen

  for (var entry of listenCounts) {
    let trackListenCount = Number.parseInt(entry.listenCount)
    for (var i = trackListenMilestoneList.length; i >= 0; i--) {
      let milestoneValue = trackListenMilestoneList[i]
      if (trackListenCount === milestoneValue || (trackListenCount >= milestoneValue && trackListenCount <= milestoneValue * 1.1)) {
        let trackId = entry.trackId
        let ownerId = entry.owner
        await _processMilestone(
          listensMilestoneNotificationType,
          ownerId,
          trackId,
          actionEntityTypes.Track,
          milestoneValue,
          blocknumber,
          timestamp,
          audiusLibs,
          tx
        )
        break
      }
    }
  }
}

async function _processMilestone (milestoneType, userId, entityId, entityType, milestoneValue, blocknumber, timestamp, audiusLibs, tx) {
  // Skip notification based on user configuration
  const { notifyMobile, notifyBrowserPush } = await shouldNotifyUser(userId, 'milestonesAndAchievements')

  let newMilestone = false
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
    }],
    transaction: tx
  })

  if (existingMilestoneQuery.length === 0) {
    newMilestone = true
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
    }, { transaction: tx })
    let notificationId = createMilestoneTx.id
    await models.NotificationAction.findOrCreate({
      where: {
        notificationId,
        actionEntityType: entityType,
        actionEntityId: milestoneValue,
        blocknumber
      },
      transaction: tx
    })
    logger.info(`processMilestone - Process milestone ${userId}, type ${milestoneType}, entityId ${entityId}, type ${entityType}, milestoneValue ${milestoneValue}`)

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
          },
          transaction: tx
        })
        logger.info(destroyTx)
        destroyTx = await models.Notification.destroy({
          where: {
            id: milestoneToDelete.id
          },
          transaction: tx
        })
        logger.info(destroyTx)
      }
    }
  }

  // Only send a milestone push notification on the first insert to the DB
  if ((notifyMobile || notifyBrowserPush) && newMilestone) {
    const notifStub = {
      userId: userId,
      type: milestoneType,
      entityId: entityId,
      blocknumber,
      timestamp,
      actions: [{
        actionEntityType: entityType,
        actionEntityId: milestoneValue,
        blocknumber
      }]
    }

    const metadata = await fetchNotificationMetadata(audiusLibs, [milestoneValue], [notifStub])
    const mapNotification = notificationResponseMap[milestoneType]
    try {
      let msgGenNotif = {
        ...notifStub,
        ...(mapNotification(notifStub, metadata))
      }
      logger.debug('processMilestone - About to generate message for milestones push notification', msgGenNotif, metadata)
      const msg = pushNotificationMessagesMap[notificationTypes.Milestone](msgGenNotif)
      logger.debug(`processMilestone - message: ${msg}`)
      const title = notificationResponseTitleMap[notificationTypes.Milestone]()
      let types = []
      if (notifyMobile) types.push(deviceType.Mobile)
      if (notifyBrowserPush) types.push(deviceType.Browser)
      await publish(msg, userId, tx, true, title, types)
    } catch (e) {
      // Log on error instead of failing
      logger.info(`Error adding push notification to buffer: ${e}. notifStub ${JSON.stringify(notifStub)}`)
    }
  }
}

module.exports = {
  indexMilestones
}
