const models = require('../models')
const { logger } = require('../logging')
const moment = require('moment')
const {
  deviceType,
  notificationTypes,
  actionEntityTypes
} = require('./constants')
const { shouldNotifyUser } = require('./utils')
const { publish } = require('./notificationQueue')
const { fetchNotificationMetadata } = require('./fetchNotificationMetadata')
const {
  notificationResponseMap,
  notificationResponseTitleMap,
  pushNotificationMessagesMap
} = require('./formatNotificationMetadata')

let subscriberPushNotifications = []

async function indexNotifications (notifications, tx, audiusLibs) {
  for (let notif of notifications) {
    // blocknumber + timestamp parsed for all notification types
    let blocknumber = notif.blocknumber
    let timestamp = Date.parse(notif.timestamp.slice(0, -2))

    // Handle the 'follow' notification type
    if (notif.type === notificationTypes.Follow) {
      let notificationTarget = notif.metadata.followee_user_id
      const shouldNotify = await shouldNotifyUser(notificationTarget, 'followers', tx)
      await _processFollowNotifications(audiusLibs, notif, blocknumber, timestamp, tx, notificationTarget, shouldNotify)
    }

    // Handle the 'repost' notification type
    // track/album/playlist
    if (notif.type === notificationTypes.Repost.base) {
      let notificationTarget = notif.metadata.entity_owner_id
      const shouldNotify = await shouldNotifyUser(notificationTarget, 'reposts', tx)
      await _processBaseRepostNotifications(audiusLibs, notif, blocknumber, timestamp, tx, notificationTarget, shouldNotify)
    }

    // Handle the 'favorite' notification type, track/album/playlist
    if (notif.type === notificationTypes.Favorite.base) {
      let notificationTarget = notif.metadata.entity_owner_id
      const shouldNotify = await shouldNotifyUser(notificationTarget, 'favorites', tx)
      await _processFavoriteNotifications(audiusLibs, notif, blocknumber, timestamp, tx, notificationTarget, shouldNotify)
    }

    // Handle the 'remix create' notification type
    if (notif.type === notificationTypes.RemixCreate) {
      let notificationTarget = notif.metadata.remix_parent_track_user_id
      const shouldNotify = await shouldNotifyUser(notificationTarget, 'remixes', tx)
      await _processRemixCreateNotifications(audiusLibs, notif, blocknumber, timestamp, tx, notificationTarget, shouldNotify)
    }

    // Handle the 'favorite' notification type, track/album/playlist
    if (notif.type === notificationTypes.RemixCosign) {
      await _processCosignNotifications(audiusLibs, notif, blocknumber, timestamp, tx)
    }

    // Handle the 'create' notification type, track/album/playlist
    if (notif.type === notificationTypes.Create.base) {
      await _processCreateNotifications(audiusLibs, notif, blocknumber, timestamp, tx)
    }
  }
  await _processSubscriberPushNotifications(tx)
}

async function _processSubscriberPushNotifications (tx) {
  let currentTime = Date.now()
  for (var i = 0; i < subscriberPushNotifications.length; i++) {
    let entry = subscriberPushNotifications[i]
    logger.debug(entry)
    let timeSince = currentTime - entry.time
    if (timeSince > 50000) {
      await publish(
        entry.msg,
        entry.notificationTarget,
        tx,
        true,
        entry.title,
        [deviceType.Mobile, deviceType.Browser]
      )
      subscriberPushNotifications[i] = false
    }
  }

  subscriberPushNotifications = subscriberPushNotifications.filter(x => x.pending)
}

async function _processFollowNotifications (audiusLibs, notif, blocknumber, timestamp, tx, notificationTarget, shouldNotify) {
  const { notifyMobile, notifyBrowserPush } = shouldNotify
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
      blocknumber,
      timestamp
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
      await models.Notification.update({
        timestamp
      }, {
        where: { id: notificationId },
        returning: true,
        plain: true,
        transaction: tx
      })
    }
  }

  // send push notification
  if (notifyMobile || notifyBrowserPush) {
    try {
      logger.debug('processFollowNotifications - about to send a push notification for follower', notif)
      let notifWithAddProps = {
        ...notif,
        actions: [{
          actionEntityType: actionEntityTypes.User,
          actionEntityId: notificationInitiator,
          blocknumber
        }]
      }

      // fetch metadata
      const metadata = await fetchNotificationMetadata(audiusLibs, notifWithAddProps.initiator, [notifWithAddProps])

      // map properties necessary to render push notification message
      // note that user.thumbnail will be undefined with default fetchThumbnail = false above
      const mapNotification = notificationResponseMap[notificationTypes.Follow]
      let msgGenNotif = {
        ...notifWithAddProps,
        ...(mapNotification(notifWithAddProps, metadata))
      }
      logger.debug('processFollowNotifications - about to generate message for follower push notification', msgGenNotif, metadata, mapNotification(msgGenNotif, metadata))

      // snippets
      const msg = pushNotificationMessagesMap[notificationTypes.Follow](msgGenNotif)
      const title = notificationResponseTitleMap[notificationTypes.Follow]()
      let types = []
      if (notifyMobile) types.push(deviceType.Mobile)
      if (notifyBrowserPush) types.push(deviceType.Browser)
      await publish(msg, notificationTarget, tx, true, title, types)
    } catch (e) {
      logger.error('processFollowNotifications - Could not send push notification for _processFollowNotifications for target user', notificationTarget, e)
    }
  }
}

async function _processBaseRepostNotifications (audiusLibs, notif, blocknumber, timestamp, tx, notificationTarget, shouldNotify) {
  let repostType = null
  let notificationEntityId = notif.metadata.entity_id
  let notificationInitiator = notif.initiator
  const { notifyMobile, notifyBrowserPush } = shouldNotify

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
      await models.Notification.update({
        timestamp
      }, {
        where: { id: notificationId },
        returning: true,
        plain: true,
        transaction: tx
      })
    }
  }

  // send push notification
  if (notifyMobile || notifyBrowserPush) {
    try {
      logger.debug('processRepostNotification - about to send a push notification for repost', notif)
      let notifWithAddProps = {
        ...notif,
        actions: [{
          actionEntityType: actionEntityTypes.User,
          actionEntityId: notificationInitiator,
          blocknumber
        }],
        entityId: notificationEntityId,
        // we're going to overwrite this property so fetchNotificationMetadata can use it
        type: repostType
      }

      // fetch metadata
      const metadata = await fetchNotificationMetadata(audiusLibs, notifWithAddProps.initiator, [notifWithAddProps])

      // map properties necessary to render push notification message
      // note that user.thumbnail will be undefined with default fetchThumbnail = false above
      const mapNotification = notificationResponseMap[repostType]
      let msgGenNotif = {
        ...notifWithAddProps,
        ...(mapNotification(notifWithAddProps, metadata))
      }
      logger.debug('processRepostNotification - About to generate message for repost push notification', msgGenNotif, metadata, mapNotification(msgGenNotif, metadata))

      // snippets
      const msg = pushNotificationMessagesMap[notificationTypes.Repost.base](msgGenNotif)
      const title = notificationResponseTitleMap[repostType]()
      let types = []
      if (notifyMobile) types.push(deviceType.Mobile)
      if (notifyBrowserPush) types.push(deviceType.Browser)
      await publish(msg, notificationTarget, tx, true, title, types)
    } catch (e) {
      logger.error('processRepostNotification - Could not send push notification for _processBaseRepostNotifications for target user', notificationTarget, e)
    }
  }
}

async function _processFavoriteNotifications (audiusLibs, notif, blocknumber, timestamp, tx, notificationTarget, shouldNotify) {
  let favoriteType = null
  let notificationEntityId = notif.metadata.entity_id
  let notificationInitiator = notif.initiator
  const { notifyMobile, notifyBrowserPush } = shouldNotify

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
      await models.Notification.update({
        timestamp
      }, {
        where: { id: notificationId },
        returning: true,
        plain: true,
        transaction: tx
      })
    }
  }

  // send push notification
  if (notifyMobile || notifyBrowserPush) {
    try {
      logger.debug('processFavoriteNotification - About to send a push notification for favorite', notif)
      let notifWithAddProps = {
        ...notif,
        actions: [{
          actionEntityType: actionEntityTypes.User,
          actionEntityId: notificationInitiator,
          blocknumber
        }],
        entityId: notificationEntityId,
        // we're going to overwrite this property so fetchNotificationMetadata can use it
        type: favoriteType
      }

      // fetch metadata
      const metadata = await fetchNotificationMetadata(audiusLibs, notifWithAddProps.initiator, [notifWithAddProps])

      // map properties necessary to render push notification message
      // note that user.thumbnail will be undefined with default fetchThumbnail = false above
      const mapNotification = notificationResponseMap[favoriteType]
      let msgGenNotif = {
        ...notifWithAddProps,
        ...(mapNotification(notifWithAddProps, metadata))
      }
      logger.debug('processFavoriteNotification - About to generate message for favorite push notification', msgGenNotif, metadata, mapNotification(msgGenNotif, metadata))

      // snippets
      const msg = pushNotificationMessagesMap[notificationTypes.Favorite.base](msgGenNotif)
      const title = notificationResponseTitleMap[favoriteType]()
      let types = []
      if (notifyMobile) types.push(deviceType.Mobile)
      if (notifyBrowserPush) types.push(deviceType.Browser)
      await publish(msg, notificationTarget, tx, true, title, types)
    } catch (e) {
      logger.error('processFavoriteNotification - Could not send push notification for _processFavoriteNotifications for target user', notificationTarget, e)
    }
  }
}

async function _processCreateNotifications (audiusLibs, notif, blocknumber, timestamp, tx) {
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
        await models.Notification.update({
          timestamp
        }, {
          where: { id: notificationId },
          returning: true,
          plain: true,
          transaction: tx
        })
      }
    }

    // send push notification to each subscriber
    try {
      let notifWithAddProps = {
        ...notif,
        actions: [{
          actionEntityType: actionEntityType,
          actionEntityId: createdActionEntityId,
          blocknumber
        }],
        entityId: notificationEntityId,
        // we're going to overwrite this property so fetchNotificationMetadata can use it
        type: createType
      }

      // fetch metadata
      const metadata = await fetchNotificationMetadata(audiusLibs, notifWithAddProps.initiator, [notifWithAddProps])

      // map properties necessary to render push notification message
      // note that user.thumbnail will be undefined with default fetchThumbnail = false above
      const mapNotification = notificationResponseMap[createType]
      let msgGenNotif = {
        ...notifWithAddProps,
        ...(mapNotification(notifWithAddProps, metadata))
      }
      logger.debug('processCreateNotifications - about to generate message for create push notification', msgGenNotif, metadata, mapNotification(msgGenNotif, metadata))

      // snippets
      const msg = pushNotificationMessagesMap[notificationTypes.Create.base](msgGenNotif)
      const title = notificationResponseTitleMap[createType]()
      subscriberPushNotifications.push({
        msg,
        notificationTarget,
        title,
        createType,
        createdActionEntityId,
        time: Date.now(),
        pending: true
      })
    } catch (e) {
      logger.error('processCreateNotifications - Could not send push notification for _processCreateNotifications for target user', notificationTarget, e)
    }
  }))

  // Dedupe album /playlist notification
  if (createType === notificationTypes.Create.album ||
      createType === notificationTypes.Create.playlist) {
    let trackIdObjectList = notif.metadata.collection_content.track_ids
    let trackIdsArray = trackIdObjectList.map(x => x.track)
    if (trackIdObjectList.length > 0) {
      // Clear duplicate notifications from identity database
      for (var entry of trackIdObjectList) {
        let trackId = entry.track
        await models.NotificationAction.destroy({
          where: {
            actionEntityType: actionEntityTypes.Track,
            actionEntityId: trackId
          }
        }, { transaction: tx })
      }

      // Clear duplicate push notifications in local queue
      let dupeFound = false
      for (let i = 0; i < subscriberPushNotifications.length; i++) {
        let pushNotif = subscriberPushNotifications[i]
        let type = pushNotif.createType
        if (type === notificationTypes.Create.track) {
          let pushActionEntityId = pushNotif.createdActionEntityId
          // Check if this pending notification includes a duplicate track
          if (trackIdsArray.includes(pushActionEntityId)) {
            logger.debug(`Found dupe push notif ${type}, trackId: ${pushActionEntityId}`)
            dupeFound = true
            subscriberPushNotifications[i].pending = false
          }
        }
      }

      if (dupeFound) {
        subscriberPushNotifications = subscriberPushNotifications.filter(x => x.pending)
      }
    }
  }
}

async function _processRemixCreateNotifications (audiusLibs, notif, blocknumber, timestamp, tx, notificationTarget, shouldNotify) {
  const {
    entity_id: childTrackId,
    entity_owner_id: childTrackUserId,
    remix_parent_track_user_id: parentTrackUserId,
    remix_parent_track_id: parentTrackId
  } = notif.metadata

  // Create/Find a Notification and NotificationAction for this remix create event
  // NOTE: RemixCreate Notifications do NOT stack. A new notification is created for each remix creation
  const momentTimestamp = moment(timestamp)
  const updatedTimestamp = momentTimestamp.add(1, 's').format('YYYY-MM-DD HH:mm:ss')

  const [notification, created] = await models.Notification.findOrCreate({
    where: {
      type: notificationTypes.RemixCreate,
      userId: parentTrackUserId,
      entityId: childTrackId,
      blocknumber,
      timestamp: updatedTimestamp
    },
    transaction: tx
  })

  let notificationAction = await models.NotificationAction.findOrCreate({
    where: {
      notificationId: notification.id,
      actionEntityType: actionEntityTypes.Track,
      actionEntityId: parentTrackId,
      blocknumber
    },
    transaction: tx
  })
  const notificationActionCreated = notificationAction[1]

  // If the notification and the notification action were already created, then this is a repeat - do not continue
  if (!created && !notificationActionCreated) return

  try {
    logger.debug('processRemixCreateNotification - About to send a push notification for remix creation', notif)
    let notifWithAddProps = {
      ...notif,
      actions: [{
        actionEntityType: actionEntityTypes.User,
        actionEntityId: parentTrackUserId,
        blocknumber
      }, {
        actionEntityType: actionEntityTypes.Track,
        actionEntityId: childTrackId,
        blocknumber
      }, {
        actionEntityType: actionEntityTypes.Track,
        actionEntityId: parentTrackId,
        blocknumber
      }],
      entityId: childTrackId,
      type: notificationTypes.RemixCreate
    }

    // fetch metadata
    const metadata = await fetchNotificationMetadata(audiusLibs, childTrackUserId, [notifWithAddProps])

    // map properties necessary to render push notification message
    // note that user.thumbnail will be undefined with default fetchThumbnail = false above
    const mapNotification = notificationResponseMap[notificationTypes.RemixCreate]
    let msgGenNotif = {
      ...notifWithAddProps,
      ...(mapNotification(notifWithAddProps, metadata))
    }
    logger.debug('processRemixCreateNotification - About to generate message for create remix push notification', msgGenNotif, metadata, mapNotification(msgGenNotif, metadata))

    const { notifyMobile, notifyBrowserPush } = shouldNotify
    // send push notification
    if (notifyMobile || notifyBrowserPush) {
      try {
        // snippets
        const msg = pushNotificationMessagesMap[notificationTypes.RemixCreate](msgGenNotif)
        const title = notificationResponseTitleMap[notificationTypes.RemixCreate]()
        let types = []
        if (notifyMobile) types.push(deviceType.Mobile)
        if (notifyBrowserPush) types.push(deviceType.Browser)
        await publish(msg, parentTrackUserId, tx, true, title, types)
      } catch (e) {
        logger.error('processRemixCreateNotification - Could not send push notification for _processRemixCreateNotifications for target user', notificationTarget, e)
      }
    }
  } catch (e) {
    logger.error('processRemixCreateNotification - Could not send push notification for _processRemixCreateNotifications for target user', notificationTarget, e)
  }
}

async function _processCosignNotifications (audiusLibs, notif, blocknumber, timestamp, tx) {
  const {
    entity_id: childTrackId,
    entity_owner_id: childTrackUserId
  } = notif.metadata
  const parentTrackUserId = notif.initiator

  // Query the Notification/NotificationActions to see if the notification already exists.
  let cosignNotifications = await models.Notification.findAll({
    where: {
      userId: childTrackUserId,
      type: notificationTypes.RemixCosign,
      entityId: childTrackId
    },
    include: [{
      model: models.NotificationAction,
      as: 'actions',
      where: {
        actionEntityType: actionEntityTypes.User,
        actionEntityId: parentTrackUserId
      }
    }],
    transaction: tx
  })

  // If this track is already cosigned, ignore
  if (cosignNotifications.length > 0) return
  const momentTimestamp = moment(timestamp)

  // Add 1 s to the timestamp so that it appears after the favorite/repost
  const updatedTimestamp = momentTimestamp.add(1, 's').format('YYYY-MM-DD HH:mm:ss')
  // Create a new Notification and NotificationAction
  // NOTE: Cosign Notifications do NOT stack. A new notification is created every time
  let cosignNotification = await models.Notification.create({
    type: notificationTypes.RemixCosign,
    userId: childTrackUserId,
    entityId: childTrackId,
    blocknumber,
    timestamp: updatedTimestamp
  }, { transaction: tx })

  await models.NotificationAction.create({
    notificationId: cosignNotification.id,
    actionEntityType: actionEntityTypes.User,
    actionEntityId: parentTrackUserId,
    blocknumber
  }, { transaction: tx })

  try {
    logger.debug('processCosignNotification - About to send a push notification for cosign', notif)
    let notifWithAddProps = {
      ...notif,
      entityId: childTrackId,
      actions: [{
        actionEntityType: actionEntityTypes.User,
        actionEntityId: parentTrackUserId,
        blocknumber
      }, {
        actionEntityType: actionEntityTypes.Track,
        actionEntityId: childTrackId,
        blocknumber
      }],
      type: notificationTypes.RemixCosign
    }

    // fetch metadata
    const metadata = await fetchNotificationMetadata(audiusLibs, notifWithAddProps.initiator, [notifWithAddProps])

    // map properties necessary to render push notification message
    // note that user.thumbnail will be undefined with default fetchThumbnail = false above
    const mapNotification = notificationResponseMap[notificationTypes.RemixCosign]
    let msgGenNotif = {
      ...notifWithAddProps,
      ...(mapNotification(notifWithAddProps, metadata))
    }
    logger.debug('processCosignNotification - About to generate message for cosign push notification', msgGenNotif, metadata, mapNotification(msgGenNotif, metadata))

    // snippets
    const msg = pushNotificationMessagesMap[notificationTypes.RemixCosign](msgGenNotif)
    const title = notificationResponseTitleMap[notificationTypes.RemixCosign]()
    let types = [deviceType.Mobile, deviceType.Browser]
    await publish(msg, childTrackUserId, tx, true, title, types)
  } catch (e) {
    logger.error('processCosignNotification - Could not send push notification for _processCosignNotifications for target user', notif.metadata.entity_owner_id, e)
  }
}

module.exports = {
  indexNotifications,
  _processFollowNotifications
}
