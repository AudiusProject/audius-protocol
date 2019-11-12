const NotificationType = require('../routes/notifications').NotificationType
const Entity = require('../routes/notifications').Entity
const mapMilestone = require('../routes/notifications').mapMilestone

const USER_NODE_IPFS_GATEWAY = 'https://usermetadata.audius.co/ipfs/'
const DEFAULT_IMAGE_URL = 'https://download.audius.co/static-resources/email/iconUser.svg'

const formatGateway = (creatorNodeEndpoint) =>
  creatorNodeEndpoint
    ? `${creatorNodeEndpoint.split(',')[0]}/ipfs/`
    : USER_NODE_IPFS_GATEWAY

const getImageUrl = (cid, gateway) =>
  cid
    ? `${gateway}${cid}`
    : DEFAULT_IMAGE_URL

function getUserImage (user) {
  const gateway = formatGateway(user.creator_node_endpoint, user.user_id)
  const profilePicture = user.profile_picture_sizes
    ? `${user.profile_picture_sizes}/1000x1000.jpg`
    : user.profile_picture

  return getImageUrl(profilePicture, gateway)
}

const formatFavorite = (notification, metadata, entity) => {
  return {
    type: NotificationType.Follow,
    users: notification.actions.map(action => {
      const userId = action.actionEntityId
      const user = metadata.users[userId]
      return { name: user.name, image: getUserImage(user) }
    }),
    entity
  }
}

const formatRepost = (notification, metadata, entity) => {
  return {
    type: NotificationType.Repost,
    users: notification.actions.map(action => {
      const userId = action.actionEntityId
      const user = metadata.users[userId]
      return { name: user.name, image: getUserImage(user) }
    }),
    entity
  }
}

const formatUserSubscription = (notification, metadata, entity, users) => {
  return {
    type: NotificationType.UserSubscription,
    users,
    entity
  }
}

const formatMilestone = (notification, metadata) => {
  return {
    type: NotificationType.Milestone,
    ...mapMilestone[notification.type],
    entity: getMilestoneEntity(notification, metadata)
  }
}

function getMilestoneEntity (notification, metadata) {
  if (notification.type === NotificationType.MilestoneFollow) return undefined
  const type = notification.actions[0].actionEntityType
  const entityId = notification.entityId
  const name = (type === Entity.Track)
    ? metadata.tracks[entityId].title
    : metadata.collections[entityId].playlist_name
  return { type, name }
}

function formatFollow (notification, metadata) {
  return {
    type: NotificationType.Follow,
    users: notification.actions.map(action => {
      const userId = action.actionEntityId
      const user = metadata.users[userId]
      return { name: user.name, image: getUserImage(user) }
    })
  }
}

function formatAnnouncement (notification) {
  return {
    type: NotificationType.Announcement,
    text: notification.shortDescription,
    hasReadMore: !!notification.longDescription
  }
}

const notificationResponseMap = {
  [NotificationType.Follow]: formatFollow,
  [NotificationType.FavoriteTrack]: (notification, metadata) => {
    const track = metadata.tracks[notification.entityId]
    return formatFavorite(notification, metadata, { type: Entity.Track, name: track.title })
  },
  [NotificationType.FavoritePlaylist]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    return formatFavorite(notification, metadata, { type: Entity.Playlist, name: collection.playlist_name })
  },
  [NotificationType.FavoriteAlbum]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    return formatFavorite(notification, metadata, { type: Entity.Album, name: collection.playlist_name })
  },
  [NotificationType.RepostTrack]: (notification, metadata) => {
    const track = metadata.tracks[notification.entityId]
    return formatRepost(notification, metadata, { type: Entity.Track, name: track.title })
  },
  [NotificationType.RepostPlaylist]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    return formatRepost(notification, metadata, { type: Entity.Playlist, name: collection.playlist_name })
  },
  [NotificationType.RepostAlbum]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    return formatRepost(notification, metadata, { type: Entity.Album, name: collection.playlist_name })
  },
  [NotificationType.CreateTrack]: (notification, metadata) => {
    const trackId = notification.actions[0].actionEntityId
    const track = metadata.tracks[trackId]
    const count = notification.actions.length
    let user = metadata.users[notification.entityId]
    let users = [{ name: user.name, image: getUserImage(user) }]
    return formatUserSubscription(notification, metadata, { type: Entity.Track, count, name: track.title }, users)
  },
  [NotificationType.CreateAlbum]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    let users = notification.actions.map(action => {
      const userId = action.actionEntityId
      const user = metadata.users[userId]
      return { name: user.name, image: getUserImage(user) }
    })
    return formatUserSubscription(notification, metadata, { type: Entity.Album, count: 1, name: collection.playlist_name }, users)
  },
  [NotificationType.CreatePlaylist]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    let users = notification.actions.map(action => {
      const userId = action.actionEntityId
      const user = metadata.users[userId]
      return { name: user.name, image: getUserImage(user) }
    })
    return formatUserSubscription(notification, metadata, { type: Entity.Playlist, count: 1, name: collection.playlist_name }, users)
  },
  [NotificationType.Announcement]: formatAnnouncement,
  [NotificationType.MilestoneRepost]: formatMilestone,
  [NotificationType.MilestoneFavorite]: formatMilestone,
  [NotificationType.MilestoneListen]: formatMilestone,
  [NotificationType.MilestoneFollow]: formatMilestone
}

function formatNotificationProps (notifications, metadata) {
  const emailNotificationProps = notifications.map(notification => {
    const mapNotification = notificationResponseMap[notification.type]
    console.log(`${notification.type} - ${mapNotification}`)
    return mapNotification(notification, metadata)
  })
  return emailNotificationProps
}

module.exports = formatNotificationProps
