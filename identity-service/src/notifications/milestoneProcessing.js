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

// Milestone are now set in discovery and passed over into identity
/**
 * Type Milestones = {
 *  follower_counts: {
 *    [ID: number]: number // milestone count
 *  },
 *  favorite_counts: {
 *    albums: {
 *     [ID: number]: number // milestone count
 *    },
 *    playlists: {
 *     [ID: number]: number // milestone count
 *    },
 *    tracks: {
 *     [ID: number]: number // milestone count
 *    }
 *  },
 *  repost_counts: {
 *    albums: {
 *     [ID: number]: number // milestone count
 *    },
 *    playlists: {
 *     [ID: number]: number // milestone count
 *    },
 *    tracks: {
 *     [ID: number]: number // milestone count
 *    }
 *  }
 * }
 *
 * type Owners = {
 *  albums: {
 *    [ID: number]: number // user id
 *  },
 *  playlists: {
 *    [ID: number]: number // user id
 *  },
 *  tracks: {
 *    [ID: number]: number // user id
 *  }
 * }
 *
 *
 * @param {*} milestones
 * @param {*} owners
 * @param {*} metadata
 * @param {*} audiusLibs
 * @param {*} tx
 */
async function indexMilestones (milestones, owners, metadata, audiusLibs, tx) {
  // Index follower milestones into notifications table
  let timestamp = new Date()
  let blocknumber = metadata.max_block_number

  // Index follower milestones
  await updateFollowerMilestones(milestones.follower_counts, blocknumber, timestamp, audiusLibs, tx)

  // Index repost milestones
  await updateSocialMilestones(milestones.repost_counts, notificationTypes.MilestoneRepost, owners, blocknumber, timestamp, audiusLibs, tx)

  // Index favorite milestones
  await updateSocialMilestones(milestones.favorite_counts, notificationTypes.MilestoneFavorite, owners, blocknumber, timestamp, audiusLibs, tx)
}

/**
 *
 * Follower Milestones
 *
 */
async function updateFollowerMilestones (followerCounts, blocknumber, timestamp, audiusLibs, tx) {
  // Parse follower milestones
  await Promise.all(Object.keys(followerCounts).map((userId) => {
    return _processMilestone(
      notificationTypes.MilestoneFollow,
      userId,
      followerCounts[userId], // milestone value for followers milestone
      actionEntityTypes.User,
      followerCounts[userId], // milestone value for followers milestone
      blocknumber,
      timestamp,
      audiusLibs,
      tx)
  }))
}

/**
 *
 * Repost Milestones
 *
 */
async function updateSocialMilestones (counts, notificationType, owners, blocknumber, timestamp, audiusLibs, tx) {
  await Promise.all(Object.keys(counts.tracks).map(trackId => {
    const milestoneThreshold = counts.tracks[trackId]
    let trackOwnerId = owners.tracks[trackId]
    return _processMilestone(
      notificationType,
      trackOwnerId,
      trackId,
      actionEntityTypes.Track,
      milestoneThreshold,
      blocknumber,
      timestamp,
      audiusLibs,
      tx
    )
  }))

  await Promise.all(Object.keys(counts.albums).map(playlistId => {
    const milestoneThreshold = counts.albums[playlistId]
    let playlistOwnerId = owners.albums[playlistId]
    return _processMilestone(
      notificationType,
      playlistOwnerId,
      playlistId,
      actionEntityTypes.Album,
      milestoneThreshold,
      blocknumber,
      timestamp,
      audiusLibs,
      tx
    )
  }))

  await Promise.all(Object.keys(counts.playlists).map(playlistId => {
    const milestoneThreshold = counts.playlists[playlistId]
    let playlistOwnerId = owners.playlists[playlistId]
    return _processMilestone(
      notificationType,
      playlistOwnerId,
      playlistId,
      actionEntityTypes.Playlist,
      milestoneThreshold,
      blocknumber,
      timestamp,
      audiusLibs,
      tx
    )
  }))
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
    const createMilestoneTx = await models.Notification.create({
      userId: userId,
      type: milestoneType,
      entityId: entityId,
      blocknumber,
      timestamp
    }, { transaction: tx })
    const notificationId = createMilestoneTx.id
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
