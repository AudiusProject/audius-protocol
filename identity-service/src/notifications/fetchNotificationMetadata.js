const moment = require('moment')
const axios = require('axios')
const models = require('../models')
const NotificationType = require('../routes/notifications').NotificationType
const Entity = require('../routes/notifications').Entity
const mergeAudiusAnnoucements = require('../routes/notifications').mergeAudiusAnnoucements
const formatNotificationProps = require('./formatNotificationMetadata')

const config = require('../config.js')
const { logger } = require('../logging')

const USER_NODE_IPFS_GATEWAY = config.get('notificationDiscoveryProvider').includes('staging') ? 'https://usermetadata.staging.audius.co/ipfs/' : 'https://usermetadata.audius.co/ipfs/'

const DEFAULT_IMAGE_URL = 'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'

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

const getLastWeek = () => moment().subtract(7, 'days')
async function sendUserNotifcationEmail (audius, userId, announcements = [], fromTime = getLastWeek(), limit = 5) {
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
        ['entityId', 'ASC']
      ],
      include: [{
        model: models.NotificationAction,
        required: true,
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
    const notificationCount = notifCountQuery.length
    const announcementIds = new Set(announcements.map(({ entityId }) => entityId))
    const filteredNotifications = notifications.filter(({ id }) => !announcementIds.has(id))

    const validUserAnnouncements = announcements
      .filter(a => moment(a.datePublished).isAfter(user.createdAt) && moment(a.datePublished).isAfter(fromTime))

    const userNotifications = mergeAudiusAnnoucements(validUserAnnouncements, filteredNotifications)
    let unreadAnnouncementCount = 0
    userNotifications.forEach((notif) => {
      if (notif.type === NotificationType.Announcement) {
        unreadAnnouncementCount += 1
      }
    })

    const finalUserNotifications = userNotifications.slice(0, limit)
    const metadata = await fetchNotificationMetadata(audius, userId, finalUserNotifications)
    const notificationsEmailProps = formatNotificationProps(finalUserNotifications, metadata)
    return [notificationsEmailProps, notificationCount + unreadAnnouncementCount]
  } catch (err) {
    logger.error(err)
  }
}

async function fetchNotificationMetadata (audius, userId, notifications) {
  let userIdsToFetch = [userId]
  let trackIdsToFetch = []
  let collectionIdsToFetch = []

  for (let notification of notifications) {
    switch (notification.type) {
      case NotificationType.Follow: {
        userIdsToFetch.push(
          ...notification.actions
            .map(({ actionEntityId }) => actionEntityId).slice(0, USER_FETCH_LIMIT)
        )
        break
      }
      case NotificationType.FavoriteTrack:
      case NotificationType.RepostTrack: {
        userIdsToFetch.push(
          ...notification.actions
            .map(({ actionEntityId }) => actionEntityId).slice(0, USER_FETCH_LIMIT)
        )
        trackIdsToFetch.push(notification.entityId)
        break
      }
      case NotificationType.FavoritePlaylist:
      case NotificationType.FavoriteAlbum:
      case NotificationType.RepostPlaylist:
      case NotificationType.RepostAlbum: {
        userIdsToFetch.push(...notification.actions.map(({ actionEntityId }) => actionEntityId).slice(0, USER_FETCH_LIMIT))
        collectionIdsToFetch.push(notification.entityId)
        break
      }
      case NotificationType.CreateAlbum:
      case NotificationType.CreatePlaylist: {
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
      case NotificationType.CreateTrack: {
        trackIdsToFetch.push(...notification.actions.map(({ actionEntityId }) => actionEntityId))
        break
      }
    }
  }

  const uniqueTrackIds = [...new Set(trackIdsToFetch)]
  const tracks = await audius.Track.getTracks(
    /** limit */ uniqueTrackIds.length,
    /** offset */ 0,
    /** idsArray */ uniqueTrackIds
  )

  const uniqueCollectionIds = [...new Set(collectionIdsToFetch)]
  const collections = await audius.Playlist.getPlaylists(
    /** limit */ uniqueCollectionIds.length,
    /** offset */ 0,
    /** idsArray */ uniqueCollectionIds
  )

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

  users = await Promise.all(users.map(async (user) => {
    user.thumbnail = await getUserImage(user)
    return user
  }))

  const trackMap = tracks.reduce((tm, track) => {
    tm[track.track_id] = track
    return tm
  }, {})

  const collectionMap = collections.reduce((cm, collection) => {
    cm[collection.playlist_id] = collection
    return cm
  }, {})

  const userMap = users.reduce((um, user) => {
    um[user.user_id] = user
    return um
  }, {})

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

const getImageUrl = (cid, gateway) =>
  cid
    ? `${gateway}${cid}`
    : DEFAULT_IMAGE_URL

async function getUserImage (user) {
  const gateway = formatGateway(user.creator_node_endpoint, user.user_id)
  const profilePicture = user.profile_picture_sizes
    ? `${user.profile_picture_sizes}/1000x1000.jpg`
    : user.profile_picture

  let imageUrl = getImageUrl(profilePicture, gateway)
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

module.exports = sendUserNotifcationEmail
module.exports.fetchNotificationMetadata = fetchNotificationMetadata
