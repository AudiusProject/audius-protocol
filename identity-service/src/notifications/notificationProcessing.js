const models = require('../models')
const { logger } = require('../logging')
const {
  notificationTypes,
  actionEntityTypes
} = require('./constants')
const { shouldNotifyUser } = require('./utils')
const { publish } = require('../awsSNS')

async function indexNotifications (notifications, tx) {
  for (let notif of notifications) {
    // blocknumber + timestamp parsed for all notification types
    let blocknumber = notif.blocknumber
    let timestamp = Date.parse(notif.timestamp.slice(0, -2))

    // Handle the 'follow' notification type
    if (notif.type === notificationTypes.Follow) {
      await _processFollowNotifications(notif, blocknumber, timestamp, tx)
    }

    // Handle the 'repost' notification type
    // track/album/playlist
    if (notif.type === notificationTypes.Repost.base) {
      await _processBaseRepostNotifications(notif, blocknumber, timestamp, tx)
    }

    // Handle the 'favorite' notification type, track/album/playlist
    if (notif.type === notificationTypes.Favorite.base) {
      await _processFavoriteNotifications(notif, blocknumber, timestamp, tx)
    }

    // Handle the 'create' notification type, track/album/playlist
    if (notif.type === notificationTypes.Create.base) {
      await _processCreateNotifications(notif, blocknumber, timestamp, tx)
    }
  }
}

async function _processFollowNotifications (notif, blocknumber, timestamp, tx) {
  let notificationTarget = notif.metadata.followee_user_id
  // Skip notification based on user settings
  const { notifyMobile, notifyWeb } = await shouldNotifyUser(notificationTarget, 'followers', tx)
  if (!notifyWeb && !notifyMobile) {
    return
  }

  if (notifyWeb) {
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

  // send push notification
  if (notifyMobile) {
    try {
      await publish('You have a new follower on Audius!', notificationTarget, true)
    } catch (e) {
      logger.error('Cound not send push notification for _processFollowNotifications for target user', notificationTarget, e)
    }
  }
}

async function _processBaseRepostNotifications (notif, blocknumber, timestamp, tx) {
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
  const { notifyMobile, notifyWeb } = await shouldNotifyUser(notificationTarget, 'reposts', tx)
  if (!notifyWeb && !notifyMobile) {
    return
  }

  if (notifyWeb) {
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

  // send push notification
  if (notifyMobile) {
    try {
      await publish('Someone reposted your track on Audius!', notificationTarget, true)
    } catch (e) {
      logger.error('Cound not send push notification for _processFollowNotifications for target user', notificationTarget, e)
    }
  }
}

async function _processFavoriteNotifications (notif, blocknumber, timestamp, tx) {
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
  const { notifyMobile, notifyWeb } = await shouldNotifyUser(notificationTarget, 'favorites', tx)
  if (!notifyWeb && !notifyMobile) {
    return
  }

  if (notifyWeb) {
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

  // send push notification
  if (notifyMobile) {
    try {
      await publish('Someone favorited your track on Audius!', notificationTarget, true)
    } catch (e) {
      logger.error('Cound not send push notification for _processFollowNotifications for target user', notificationTarget, e)
    }
  }
}

async function _processCreateNotifications (notif, blocknumber, timestamp, tx) {
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
  if (subscribers.length === 0) { return }

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

    // send push notification to each subsriber
    try {
      await publish('Someone you subscribe to uploaded new content!', notificationTarget, true)
    } catch (e) {
      logger.error('Cound not send push notification for _processFollowNotifications for target user', notificationTarget, e)
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

module.exports = {
  indexNotifications
}
