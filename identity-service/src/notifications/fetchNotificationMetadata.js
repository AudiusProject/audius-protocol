const moment = require('moment')
const axios = require('axios')
const models = require('../models')
const { notificationTypes: NotificationType } = require('../notifications/constants')
const Entity = require('../routes/notifications').Entity
const mergeAudiusAnnoucements = require('../routes/notifications').mergeAudiusAnnoucements
const { formatEmailNotificationProps } = require('./formatNotificationMetadata')

const config = require('../config.js')
const { logger } = require('../logging')

const USER_NODE_IPFS_GATEWAY = config.get('environment').includes('staging') ? 'https://usermetadata.staging.audius.co/ipfs/' : 'https://usermetadata.audius.co/ipfs/'

const DEFAULT_IMAGE_URL = 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'
const DEFAULT_TRACK_IMAGE_URL = 'https://download.audius.co/static-resources/email/imageTrackEmpty.jpg'

// The number of users to fetch / display per notification (The displayed number of users)
const USER_FETCH_LIMIT = 10

/* Merges the notifications with the user announcements in time sorted order (Most recent first).
 *
 * @param {AudiusLibs} audius                   Audius Libs instance
 * @param {number} userId                       The blockchain user id of the recipient of the user
 * @param {Array<Announcement>} announcements   Announcements set on the app
 * @param {moment Time} fromTime                The moment time object from which to get notifications
 * @param {number?} limit                       The max number of notification to attach in the email
 *
 * @return {Promise<Object>}
 */

const EXCLUDED_EMAIL_SOLANA_NOTIF_TYPES = [NotificationType.TipSend]

const getLastWeek = () => moment().subtract(7, 'days')
async function getEmailNotifications (audius, userId, announcements = [], fromTime = getLastWeek(), limit = 5) {
  try {
    const user = await models.User.findOne({
      where: { blockchainUserId: userId },
      attributes: ['createdAt']
    })

    const { rows: notifications } = await models.Notification.findAndCountAll({
      where: {
        userId,
        isViewed: false,
        isRead: false,
        isHidden: false,
        timestamp: {
          [models.Sequelize.Op.gt]: fromTime.toDate()
        }
      },
      order: [
        ['timestamp', 'DESC'],
        ['entityId', 'ASC'],
        [{ model: models.NotificationAction, as: 'actions' }, 'createdAt', 'DESC']
      ],
      include: [{
        model: models.NotificationAction,
        required: true,
        as: 'actions'
      }],
      limit
    })

    const { rows: solanaNotifications } = await models.SolanaNotification.findAndCountAll({
      where: {
        userId,
        isViewed: false,
        isRead: false,
        isHidden: false,
        createdAt: {
          [models.Sequelize.Op.gt]: fromTime.toDate()
        },
        type: {
          [models.Sequelize.Op.notIn]: EXCLUDED_EMAIL_SOLANA_NOTIF_TYPES
        }
      },
      order: [
        ['createdAt', 'DESC'],
        ['entityId', 'ASC'],
        [{ model: models.SolanaNotificationAction, as: 'actions' }, 'createdAt', 'DESC']
      ],
      include: [{
        model: models.SolanaNotificationAction,
        as: 'actions'
      }],
      limit
    })

    let notifCountQuery = await models.Notification.findAll({
      where: {
        userId,
        isViewed: false,
        isRead: false,
        isHidden: false,
        timestamp: {
          [models.Sequelize.Op.gt]: fromTime.toDate()
        }
      },
      include: [{ model: models.NotificationAction, as: 'actions', required: true, attributes: [] }],
      attributes: [[models.Sequelize.fn('COUNT', models.Sequelize.col('Notification.id')), 'total']],
      group: ['Notification.id']
    })

    const solanaNotifCountQuery = await models.SolanaNotification.findAll({
      where: {
        userId,
        isViewed: false,
        isRead: false,
        isHidden: false,
        createdAt: {
          [models.Sequelize.Op.gt]: fromTime.toDate()
        },
        type: {
          [models.Sequelize.Op.notIn]: EXCLUDED_EMAIL_SOLANA_NOTIF_TYPES
        }
      },
      include: [{ model: models.SolanaNotificationAction, as: 'actions', attributes: [] }],
      attributes: [[models.Sequelize.fn('COUNT', models.Sequelize.col('SolanaNotification.id')), 'total']],
      group: ['SolanaNotification.id']
    })

    const notificationCount = notifCountQuery.length + solanaNotifCountQuery.length
    const announcementIds = new Set(announcements.map(({ entityId }) => entityId))
    const filteredNotifications = notifications.concat(solanaNotifications).filter(({ id }) => !announcementIds.has(id))

    let tenDaysAgo = moment().subtract(10, 'days')

    // An announcement is valid if it's
    // 1.) created after the user
    // 2.) created after "fromTime" which represent the time the last email was sent
    // 3.) created within the last 10 days
    const validUserAnnouncements = announcements
      .filter(a => (
        moment(a.datePublished).isAfter(user.createdAt) &&
        moment(a.datePublished).isAfter(fromTime) &&
        moment(a.datePublished).isAfter(tenDaysAgo)
      ))

    const userNotifications = mergeAudiusAnnoucements(validUserAnnouncements, filteredNotifications)
    let unreadAnnouncementCount = 0
    userNotifications.forEach((notif) => {
      if (notif.type === NotificationType.Announcement) {
        unreadAnnouncementCount += 1
      }
    })

    if (userNotifications.length === 0) {
      return [{}, 0]
    }

    const finalUserNotifications = userNotifications.slice(0, limit)

    const fethNotificationsTime = Date.now()
    const metadata = await fetchNotificationMetadata(audius, [userId], finalUserNotifications, true, true)
    const fetchDataDuration = (Date.now() - fethNotificationsTime) / 1000
    logger.info({ job: 'fetchNotificationMetadata', duration: fetchDataDuration }, `fetchNotificationMetadata | get metadata ${fetchDataDuration} sec`)
    const notificationsEmailProps = formatEmailNotificationProps(finalUserNotifications, metadata)
    return [notificationsEmailProps, notificationCount + unreadAnnouncementCount]
  } catch (err) {
    logger.error(err)
  }
}

async function fetchNotificationMetadata (audius, userIds = [], notifications, fetchThumbnails = false, isEmailNotif = false) {
  let userIdsToFetch = [...userIds]
  let trackIdsToFetch = []
  let collectionIdsToFetch = []
  let fetchTrackRemixParents = []

  for (let notification of notifications) {
    switch (notification.type) {
      case NotificationType.Follow:
      case NotificationType.ChallengeReward:
      case NotificationType.TierChange: {
        userIdsToFetch.push(
          ...notification.actions
            .map(({ actionEntityId }) => actionEntityId).slice(0, USER_FETCH_LIMIT)
        )
        break
      }
      case NotificationType.Favorite.track:
      case NotificationType.Repost.track: {
        userIdsToFetch.push(
          ...notification.actions
            .map(({ actionEntityId }) => actionEntityId).slice(0, USER_FETCH_LIMIT)
        )
        trackIdsToFetch.push(notification.entityId)
        break
      }
      case NotificationType.Favorite.playlist:
      case NotificationType.Favorite.album:
      case NotificationType.Repost.playlist:
      case NotificationType.Repost.album: {
        userIdsToFetch.push(...notification.actions.map(({ actionEntityId }) => actionEntityId).slice(0, USER_FETCH_LIMIT))
        collectionIdsToFetch.push(notification.entityId)
        break
      }
      case NotificationType.Create.album:
      case NotificationType.Create.playlist: {
        collectionIdsToFetch.push(notification.entityId)
        break
      }
      case NotificationType.MilestoneRepost:
      case NotificationType.MilestoneFavorite:
      case NotificationType.MilestoneListen: {
        if (notification.actions[0].actionEntityType === Entity.Track) {
          trackIdsToFetch.push(notification.entityId)
        } else {
          collectionIdsToFetch.push(notification.entityId)
        }
        break
      }
      case NotificationType.Create.track: {
        trackIdsToFetch.push(...notification.actions.map(({ actionEntityId }) => actionEntityId))
        break
      }
      case NotificationType.RemixCreate: {
        trackIdsToFetch.push(notification.entityId)
        for (const action of notification.actions) {
          if (action.actionEntityType === Entity.Track) {
            trackIdsToFetch.push(action.actionEntityId)
          } else if (action.actionEntityType === Entity.User) {
            userIdsToFetch.push(action.actionEntityId)
          }
        }
        break
      }
      case NotificationType.RemixCosign: {
        trackIdsToFetch.push(notification.entityId)
        fetchTrackRemixParents.push(notification.entityId)
        for (const action of notification.actions) {
          if (action.actionEntityType === Entity.Track) {
            trackIdsToFetch.push(action.actionEntityId)
          } else if (action.actionEntityType === Entity.User) {
            userIdsToFetch.push(action.actionEntityId)
          }
        }
        break
      }
      case NotificationType.TrendingTrack: {
        trackIdsToFetch.push(notification.entityId)
        break
      }
      case NotificationType.AddTrackToPlaylist: {
        trackIdsToFetch.push(notification.entityId)
        userIdsToFetch.push(notification.metadata.playlistOwnerId)
        collectionIdsToFetch.push(notification.metadata.playlistId)
        break
      }
      case NotificationType.Reaction: {
        userIdsToFetch.push(notification.initiator)
        if (isEmailNotif) {
          userIdsToFetch.push(notification.userId)
          userIdsToFetch.push(notification.entityId)
        }
        break
      }
      case NotificationType.SupporterRankUp: {
        // Tip sender needed for SupporterRankUp
        userIdsToFetch.push(notification.metadata.entity_id)
        const x = notification.metadata.supportingUserId
        if (isEmailNotif) {
          userIdsToFetch.push(notification.userId)
          userIdsToFetch.push(x)
        }
        break
      }
      case NotificationType.SupportingRankUp: {
        // Tip recipient needed for SupportingRankUp
        userIdsToFetch.push(notification.initiator)
        const x = notification.metadata.supportedUserId
        if (isEmailNotif) {
          userIdsToFetch.push(notification.userId)
          userIdsToFetch.push(x)
        }
        break
      }
      case NotificationType.TipReceive: {
        // Fetch the sender of the tip
        userIdsToFetch.push(notification.metadata.entity_id)
        if (isEmailNotif) {
          userIdsToFetch.push(notification.userId)
          userIdsToFetch.push(notification.entityId)
        }
        break
      }
    }
  }

  const uniqueTrackIds = [...new Set(trackIdsToFetch)]

  const tracks = []
  // Batch track fetches to avoid large request lines
  const trackBatchSize = 100 // use default limit
  for (let trackBatchOffset = 0; trackBatchOffset < uniqueTrackIds.length; trackBatchOffset += trackBatchSize) {
    const trackBatch = uniqueTrackIds.slice(trackBatchOffset, trackBatchOffset + trackBatchSize)
    const tracksResponse = await audius.Track.getTracks(
      /** limit */ trackBatch.length,
      /** offset */ 0,
      /** idsArray */ trackBatch
    )
    tracks.push(...tracksResponse)
  }

  if (!Array.isArray(tracks)) {
    logger.error(`fetchNotificationMetadata | Unable to fetch track ids ${uniqueTrackIds.join(',')}`)
  }

  const trackMap = tracks.reduce((tm, track) => {
    tm[track.track_id] = track
    return tm
  }, {})

  // Fetch the parents of the remix tracks & add to the tracks map
  if (fetchTrackRemixParents.length > 0) {
    const trackParentIds = fetchTrackRemixParents.reduce((parentTrackIds, remixTrackId) => {
      const track = trackMap[remixTrackId]
      const parentIds = (track.remix_of && Array.isArray(track.remix_of.tracks))
        ? track.remix_of.tracks.map(t => t.parent_track_id)
        : []
      return parentTrackIds.concat(parentIds)
    }, [])

    const uniqueParentTrackIds = [...new Set(trackParentIds)]
    let parentTracks = await audius.Track.getTracks(
      /** limit */ uniqueParentTrackIds.length,
      /** offset */ 0,
      /** idsArray */ uniqueParentTrackIds
    )
    if (!Array.isArray(parentTracks)) {
      logger.error(`fetchNotificationMetadata | Unable to fetch parent track ids ${uniqueParentTrackIds.join(',')}`)
    }

    parentTracks.forEach(track => {
      trackMap[track.track_id] = track
    })
  }

  const uniqueCollectionIds = [...new Set(collectionIdsToFetch)]
  const collections = await audius.Playlist.getPlaylists(
    /** limit */ uniqueCollectionIds.length,
    /** offset */ 0,
    /** idsArray */ uniqueCollectionIds
  )

  if (!Array.isArray(collections)) {
    logger.error(`fetchNotificationMetadata | Unable to fetch collection ids ${uniqueCollectionIds.join(',')}`)
  }

  userIdsToFetch.push(
    ...tracks.map(({ owner_id: id }) => id),
    ...collections.map(({ playlist_owner_id: id }) => id)
  )
  const uniqueUserIds = [...new Set(userIdsToFetch)]

  let users = await audius.User.getUsers(
    /** limit */ uniqueUserIds.length,
    /** offset */ 0,
    /** idsArray */ uniqueUserIds
  )

  if (!Array.isArray(users)) {
    logger.error(`fetchNotificationMetadata | Unable to fetch user ids ${uniqueUserIds.join(',')}`)
  }

  // Fetch all the social handles and attach to the users - For twitter sharing
  const socialHandles = await models.SocialHandles.findAll({
    where: {
      handle: users.map(({ handle }) => handle)
    }
  })
  const twitterHandleMap = socialHandles.reduce((handleMapping, socialHandle) => {
    if (socialHandle.twitterHandle) handleMapping[socialHandle.handle] = socialHandle.twitterHandle
    return handleMapping
  }, {})

  users = await Promise.all(users.map(async (user) => {
    if (fetchThumbnails) {
      user.thumbnail = await getUserImage(user)
    }
    if (twitterHandleMap[user.handle]) {
      user.twitterHandle = twitterHandleMap[user.handle]
    }
    return user
  }))

  const collectionMap = collections.reduce((cm, collection) => {
    cm[collection.playlist_id] = collection
    return cm
  }, {})

  const userMap = users.reduce((um, user) => {
    um[user.user_id] = user
    return um
  }, {})

  if (fetchThumbnails) {
    for (let trackId of Object.keys(trackMap)) {
      const track = trackMap[trackId]
      track.thumbnail = await getTrackImage(track, userMap)
    }
  }

  return {
    tracks: trackMap,
    collections: collectionMap,
    users: userMap
  }
}

const formatGateway = (creatorNodeEndpoint) =>
  creatorNodeEndpoint
    ? `${creatorNodeEndpoint.split(',')[0]}/ipfs/`
    : USER_NODE_IPFS_GATEWAY

const getImageUrl = (cid, gateway, defaultImg) =>
  cid
    ? `${gateway}${cid}`
    : defaultImg

async function getUserImage (user) {
  const gateway = formatGateway(user.creator_node_endpoint)
  const profilePicture = user.profile_picture_sizes
    ? `${user.profile_picture_sizes}/1000x1000.jpg`
    : user.profile_picture

  let imageUrl = getImageUrl(profilePicture, gateway, DEFAULT_IMAGE_URL)
  if (imageUrl === DEFAULT_IMAGE_URL) { return imageUrl }

  try {
    await axios({
      method: 'head',
      url: imageUrl,
      timeout: 5000
    })
    return imageUrl
  } catch (e) {
    return DEFAULT_IMAGE_URL
  }
}

async function getTrackImage (track, usersMap) {
  const trackOwnerId = track.owner_id
  const trackOwner = usersMap[trackOwnerId]
  const gateway = formatGateway(trackOwner.creator_node_endpoint)
  const trackCoverArt = track.cover_art_sizes
    ? `${track.cover_art_sizes}/480x480.jpg`
    : track.cover_art

  let imageUrl = getImageUrl(trackCoverArt, gateway, DEFAULT_TRACK_IMAGE_URL)
  if (imageUrl === DEFAULT_TRACK_IMAGE_URL) { return imageUrl }

  try {
    await axios({
      method: 'head',
      url: imageUrl,
      timeout: 5000
    })
    return imageUrl
  } catch (e) {
    return DEFAULT_TRACK_IMAGE_URL
  }
}

module.exports = getEmailNotifications
module.exports.fetchNotificationMetadata = fetchNotificationMetadata
