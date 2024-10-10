const {
  notificationTypes: NotificationType
} = require('../notifications/constants')
const Entity = require('../routes/notifications').Entity
const mapMilestone = require('../routes/notifications').mapMilestone
const { actionEntityTypes, notificationTypes } = require('./constants')
const { formatWei, capitalize } = require('./processNotifications/utils')
const BN = require('bn.js')

const getRankSuffix = (num) => {
  if (num === 1) return 'st'
  else if (num === 2) return 'nd'
  else if (num === 3) return 'rd'
  return 'th'
}

const formatFavorite = (notification, metadata, entity) => {
  return {
    type: NotificationType.Favorite.base,
    users: notification.actions.map((action) => {
      const userId = action.actionEntityId
      const user = metadata.users[userId]
      if (!user) return null
      return {
        id: user.id,
        handle: user.handle,
        name: user.name,
        image: user.thumbnail
      }
    }),
    entity
  }
}

const formatRepost = (notification, metadata, entity) => {
  return {
    type: NotificationType.Repost.base,
    users: notification.actions.map((action) => {
      const userId = action.actionEntityId
      const user = metadata.users[userId]
      if (!user) return null
      return {
        id: user.user_id,
        handle: user.handle,
        name: user.name,
        image: user.thumbnail
      }
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

const formatMilestone = (achievement) => (notification, metadata) => {
  return {
    type: NotificationType.Milestone,
    ...mapMilestone[notification.type],
    entity: getMilestoneEntity(notification, metadata),
    value: notification.actions[0].actionEntityId,
    achievement
  }
}

function formatTrendingTrack(notification, metadata) {
  const trackId = notification.entityId
  const track = metadata.tracks[trackId]
  if (!notification.actions.length === 1) return null
  const rank = notification.actions[0].actionEntityId
  const type = notification.actions[0].actionEntityType
  const [time, genre] = type.split(':')
  return {
    type: NotificationType.TrendingTrack,
    entity: track,
    rank,
    time,
    genre
  }
}

function getMilestoneEntity(notification, metadata) {
  if (notification.type === NotificationType.MilestoneFollow) return undefined
  const type = notification.actions[0].actionEntityType
  const entityId = notification.entityId
  const name =
    type === Entity.Track
      ? metadata.tracks[entityId].title
      : metadata.collections[entityId].playlist_name
  return { type, name }
}

function formatFollow(notification, metadata) {
  return {
    type: NotificationType.Follow,
    users: notification.actions.map((action) => {
      const userId = action.actionEntityId
      const user = metadata.users[userId]
      if (!user) return null
      return {
        id: userId,
        handle: user.handle,
        name: user.name,
        image: user.thumbnail
      }
    })
  }
}

function formatAnnouncement(notification) {
  return {
    type: NotificationType.Announcement,
    text: notification.shortDescription,
    hasReadMore: !!notification.longDescription
  }
}

function formatRemixCreate(notification, metadata) {
  const trackId = notification.entityId
  const parentTrackAction = notification.actions.find(
    (action) =>
      action.actionEntityType === actionEntityTypes.Track &&
      action.actionEntityId !== trackId
  )
  const parentTrackId = parentTrackAction.actionEntityId
  const remixTrack = metadata.tracks[trackId]
  const parentTrack = metadata.tracks[parentTrackId]
  const userId = remixTrack.owner_id
  const parentTrackUserId = parentTrack.owner_id

  return {
    type: NotificationType.RemixCreate,
    remixUser: metadata.users[userId],
    remixTrack,
    parentTrackUser: metadata.users[parentTrackUserId],
    parentTrack
  }
}

function formatRemixCosign(notification, metadata) {
  const trackId = notification.entityId
  const parentTrackUserAction = notification.actions.find(
    (action) => action.actionEntityType === actionEntityTypes.User
  )
  const parentTrackUserId = parentTrackUserAction.actionEntityId
  const remixTrack = metadata.tracks[trackId]
  const parentTracks = remixTrack.remix_of.tracks.map(
    (t) => metadata.tracks[t.parent_track_id]
  )
  return {
    type: NotificationType.RemixCosign,
    parentTrackUser: metadata.users[parentTrackUserId],
    parentTracks,
    remixTrack
  }
}

function formatChallengeReward(notification) {
  const challengeId = notification.actions[0].actionEntityType
  return {
    type: NotificationType.ChallengeReward,
    challengeId,
    rewardAmount: challengeInfoMap[challengeId].amount
  }
}

function formatAddTrackToPlaylist(notification, metadata) {
  return {
    type: NotificationType.AddTrackToPlaylist,
    track: metadata.tracks[notification.entityId],
    playlist: metadata.collections[notification.metadata.playlistId],
    playlistOwner: metadata.users[notification.metadata.playlistOwnerId]
  }
}

function formatReaction(notification, metadata) {
  const userId = notification.initiator
  const user = metadata.users[userId]
  return {
    type: NotificationType.Reaction,
    reactingUser: user,
    amount: formatWei(new BN(notification.metadata.reacted_to_entity.amount))
  }
}
// This is different from the above corresponding function
// because it operates on data coming from the database
// as opposed to that coming from the DN.
function formatReactionEmail(notification, extras) {
  const {
    entityId,
    metadata: {
      reactedToEntity: { amount }
    }
  } = notification
  return {
    type: NotificationType.Reaction,
    reactingUser: extras.users[entityId],
    amount: formatWei(new BN(amount))
  }
}

function formatTipReceive(notification, metadata) {
  const userId = notification.metadata.entity_id
  const user = metadata.users[userId]
  return {
    type: NotificationType.TipReceive,
    sendingUser: user,
    amount: formatWei(new BN(notification.metadata.amount))
  }
}
// This is different from the above corresponding function
// because it operates on data coming from the database
// as opposed to that coming from the DN.
function formatTipReceiveEmail(notification, extras) {
  const {
    entityId,
    metadata: { amount }
  } = notification
  return {
    type: NotificationType.TipReceive,
    sendingUser: extras.users[entityId],
    amount: formatWei(new BN(amount))
  }
}

function formatSupporterRankUp(notification, metadata) {
  // Sending user
  const userId = notification.metadata.entity_id
  const user = metadata.users[userId]
  return {
    type: NotificationType.SupporterRankUp,
    rank: notification.metadata.rank,
    sendingUser: user
  }
}
// This is different from the above corresponding function
// because it operates on data coming from the database
// as opposed to that coming from the DN.
function formatSupporterRankUpEmail(notification, extras) {
  const {
    entityId: rank,
    metadata: { supportingUserId }
  } = notification
  return {
    type: NotificationType.SupporterRankUp,
    rank,
    sendingUser: extras.users[supportingUserId]
  }
}

function formatSupportingRankUp(notification, metadata) {
  // Receiving user
  const userId = notification.initiator
  const user = metadata.users[userId]
  return {
    type: NotificationType.SupportingRankUp,
    rank: notification.metadata.rank,
    receivingUser: user
  }
}

function formatSupporterDethroned(notification, metadata) {
  return {
    type: NotificationType.SupporterDethroned,
    receivingUser: notification.initiator,
    newTopSupporter:
      metadata.users[notification.metadata.newTopSupporterUserId],
    supportedUser: metadata.users[notification.metadata.supportedUserId],
    oldAmount: formatWei(new BN(notification.metadata.oldAmount)),
    newAmount: formatWei(new BN(notification.metadata.newAmount))
  }
}

// This is different from the above corresponding function
// because it operates on data coming from the database
// as opposed to that coming from the DN.
function formatSupportingRankUpEmail(notification, extras) {
  const {
    entityId: rank,
    metadata: { supportedUserId }
  } = notification
  return {
    type: NotificationType.SupportingRankUp,
    rank,
    receivingUser: extras.users[supportedUserId]
  }
}

// Copied directly from AudiusClient

const notificationResponseMap = {
  [NotificationType.Follow]: formatFollow,
  [NotificationType.Favorite.track]: (notification, metadata) => {
    const track = metadata.tracks[notification.entityId]
    return formatFavorite(notification, metadata, {
      type: Entity.Track,
      name: track.title
    })
  },
  [NotificationType.Favorite.playlist]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    return formatFavorite(notification, metadata, {
      type: Entity.Playlist,
      name: collection.playlist_name
    })
  },
  [NotificationType.Favorite.album]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    return formatFavorite(notification, metadata, {
      type: Entity.Album,
      name: collection.playlist_name
    })
  },
  [NotificationType.Repost.track]: (notification, metadata) => {
    const track = metadata.tracks[notification.entityId]
    return formatRepost(notification, metadata, {
      type: Entity.Track,
      name: track.title
    })
  },
  [NotificationType.Repost.playlist]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    return formatRepost(notification, metadata, {
      type: Entity.Playlist,
      name: collection.playlist_name
    })
  },
  [NotificationType.Repost.album]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    return formatRepost(notification, metadata, {
      type: Entity.Album,
      name: collection.playlist_name
    })
  },
  [NotificationType.Create.track]: (notification, metadata) => {
    const trackId = notification.actions[0].actionEntityId
    const track = metadata.tracks[trackId]
    const count = notification.actions.length
    const user = metadata.users[notification.entityId]
    const users = [{ name: user.name, image: user.thumbnail }]
    return formatUserSubscription(
      notification,
      metadata,
      { type: Entity.Track, count, name: track.title },
      users
    )
  },
  [NotificationType.Create.album]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    const users = notification.actions.map((action) => {
      const userId = action.actionEntityId
      const user = metadata.users[userId]
      return { name: user.name, image: user.thumbnail }
    })
    return formatUserSubscription(
      notification,
      metadata,
      { type: Entity.Album, count: 1, name: collection.playlist_name },
      users
    )
  },
  [NotificationType.Create.playlist]: (notification, metadata) => {
    const collection = metadata.collections[notification.entityId]
    const users = notification.actions.map((action) => {
      const userId = action.actionEntityId
      const user = metadata.users[userId]
      return { name: user.name, image: user.thumbnail }
    })
    return formatUserSubscription(
      notification,
      metadata,
      { type: Entity.Playlist, count: 1, name: collection.playlist_name },
      users
    )
  },
  [NotificationType.RemixCreate]: formatRemixCreate,
  [NotificationType.RemixCosign]: formatRemixCosign,
  [NotificationType.TrendingTrack]: formatTrendingTrack,
  [NotificationType.ChallengeReward]: formatChallengeReward,
  [NotificationType.Reaction]: formatReaction,
  [NotificationType.TipReceive]: formatTipReceive,
  [NotificationType.SupporterRankUp]: formatSupporterRankUp,
  [NotificationType.SupportingRankUp]: formatSupportingRankUp,
  [NotificationType.SupporterDethroned]: formatSupporterDethroned,
  [NotificationType.Announcement]: formatAnnouncement,
  [NotificationType.MilestoneRepost]: formatMilestone('repost'),
  [NotificationType.MilestoneFavorite]: formatMilestone('favorite'),
  [NotificationType.MilestoneListen]: formatMilestone('listen'),
  [NotificationType.MilestoneFollow]: formatMilestone('follow'),
  [NotificationType.AddTrackToPlaylist]: (notification, metadata) => {
    return formatAddTrackToPlaylist(notification, metadata)
  }
}

const emailNotificationResponseMap = {
  ...notificationResponseMap,
  [NotificationType.Reaction]: formatReactionEmail,
  [NotificationType.TipReceive]: formatTipReceiveEmail,
  [NotificationType.SupporterRankUp]: formatSupporterRankUpEmail,
  [NotificationType.SupportingRankUp]: formatSupportingRankUpEmail
}

const NewFavoriteTitle = 'New Favorite'
const NewRepostTitle = 'New Repost'
const NewFollowerTitle = 'New Follower'
const NewMilestoneTitle = 'Congratulations! 🎉'
const NewSubscriptionUpdateTitle = 'New Artist Update'

const TrendingTrackTitle = 'Congrats - You’re Trending! 📈'
const RemixCreateTitle = 'New Remix Of Your Track ♻️'
const RemixCosignTitle = 'New Track Co-Sign! 🔥'
const AddTrackToPlaylistTitle = 'Your track got on a playlist! 💿'
const TipReceiveTitle = 'You Received a Tip!'
const DethronedTitle = "👑 You've Been Dethroned!"

const challengeInfoMap = {
  p: {
    title: '✅️ Complete your Profile',
    amount: 1
  },
  l: {
    title: '🎧 Listening Streak: 7 Days',
    amount: 1
  },
  u: {
    title: '🎶 Upload 3 Tracks',
    amount: 1
  },
  r: {
    title: '📨 Invite your Friends',
    amount: 1
  },
  rd: {
    title: '📨 Invite your Friends',
    amount: 1
  },
  rv: {
    title: '📨 Invite your Fans',
    amount: 1
  },
  v: {
    title: '✅️ Link Verified Accounts',
    amount: 5
  },
  m: {
    title: '📲 Get the App',
    amount: 1
  },
  ft: {
    title: '🤑 Send Your First Tip',
    amount: 2
  },
  fp: {
    title: '🎼 Create a Playlist',
    amount: 2
  }
}

const makeReactionTitle = (notification) =>
  `${capitalize(notification.reactingUser.name)} reacted`
const makeSupportingOrSupporterTitle = (notification) =>
  `#${notification.rank} Top Supporter`

const notificationResponseTitleMap = {
  [NotificationType.Follow]: () => NewFollowerTitle,
  [NotificationType.Favorite.track]: () => NewFavoriteTitle,
  [NotificationType.Favorite.playlist]: () => NewFavoriteTitle,
  [NotificationType.Favorite.album]: () => NewFavoriteTitle,
  [NotificationType.Repost.track]: () => NewRepostTitle,
  [NotificationType.Repost.playlist]: () => NewRepostTitle,
  [NotificationType.Repost.album]: () => NewRepostTitle,
  [NotificationType.Create.track]: () => NewSubscriptionUpdateTitle,
  [NotificationType.Create.album]: () => NewSubscriptionUpdateTitle,
  [NotificationType.Create.playlist]: () => NewSubscriptionUpdateTitle,
  [NotificationType.MilestoneListen]: () => NewMilestoneTitle,
  [NotificationType.Milestone]: () => NewMilestoneTitle,
  [NotificationType.TrendingTrack]: () => TrendingTrackTitle,
  [NotificationType.RemixCreate]: () => RemixCreateTitle,
  [NotificationType.RemixCosign]: () => RemixCosignTitle,
  [NotificationType.ChallengeReward]: (notification) =>
    challengeInfoMap[notification.challengeId].title,
  [NotificationType.AddTrackToPlaylist]: () => AddTrackToPlaylistTitle,
  [NotificationType.Reaction]: makeReactionTitle,
  [NotificationType.TipReceive]: () => TipReceiveTitle,
  [NotificationType.SupporterRankUp]: makeSupportingOrSupporterTitle,
  [NotificationType.SupportingRankUp]: makeSupportingOrSupporterTitle,
  [NotificationType.SupporterDethroned]: () => DethronedTitle
}

function formatEmailNotificationProps(notifications, extras) {
  const emailNotificationProps = notifications.map((notification) => {
    const mapNotification = emailNotificationResponseMap[notification.type]
    return mapNotification(notification, extras)
  })
  return emailNotificationProps
}

// TODO (DM) - unify this with the email messages
const pushNotificationMessagesMap = {
  [notificationTypes.Favorite.base](notification) {
    const [user] = notification.users
    return `${
      user.name
    } favorited your ${notification.entity.type.toLowerCase()} ${
      notification.entity.name
    }`
  },
  [notificationTypes.Repost.base](notification) {
    const [user] = notification.users
    return `${
      user.name
    } reposted your ${notification.entity.type.toLowerCase()} ${
      notification.entity.name
    }`
  },
  [notificationTypes.Follow](notification) {
    const [user] = notification.users
    return `${user.name} followed you`
  },
  [notificationTypes.Announcement.base](notification) {
    return notification.text
  },
  [notificationTypes.Milestone](notification) {
    if (notification.entity) {
      const entity = notification.entity.type.toLowerCase()
      return `Your ${entity} ${
        notification.entity.name
      } has reached over ${notification.value.toLocaleString()} ${
        notification.achievement
      }s`
    } else {
      return `You have reached over ${notification.value.toLocaleString()} Followers `
    }
  },
  [notificationTypes.Create.base](notification) {
    const [user] = notification.users
    const type = notification.entity.type.toLowerCase()
    if (
      notification.entity.type === actionEntityTypes.Track &&
      !isNaN(notification.entity.count) &&
      notification.entity.count > 1
    ) {
      return `${user.name} released ${notification.entity.count} new ${type}s`
    }
    return `${user.name} released a new ${type} ${notification.entity.name}`
  },
  [notificationTypes.RemixCreate](notification) {
    return `New remix of your track ${notification.parentTrack.title}: ${notification.remixUser.name} uploaded ${notification.remixTrack.title}`
  },
  [notificationTypes.RemixCosign](notification) {
    return `${notification.parentTrackUser.name} Co-Signed your Remix of ${notification.remixTrack.title}`
  },
  [notificationTypes.TrendingTrack](notification) {
    const rank = notification.rank
    const rankSuffix = getRankSuffix(rank)
    return `Your Track ${notification.entity.title} is ${notification.rank}${rankSuffix} on Trending Right Now! 🍾`
  },
  [notificationTypes.ChallengeReward](notification) {
    return notification.challengeId === 'rd'
      ? `You’ve received ${
          challengeInfoMap[notification.challengeId].amount
        } $AUDIO for being referred! Invite your friends to join to earn more!`
      : `You’ve earned ${
          challengeInfoMap[notification.challengeId].amount
        } $AUDIO for completing this challenge!`
  },
  [notificationTypes.AddTrackToPlaylist](notification) {
    return `${notification.playlistOwner.name} added ${notification.track.title} to their playlist ${notification.playlist.playlist_name}`
  },
  [notificationTypes.Reaction](notification) {
    return `${capitalize(
      notification.reactingUser.name
    )} reacted to your tip of ${notification.amount} $AUDIO`
  },
  [notificationTypes.SupporterRankUp](notification) {
    return `${capitalize(notification.sendingUser.name)} became your #${
      notification.rank
    } Top Supporter!`
  },
  [notificationTypes.SupportingRankUp](notification) {
    return `You're now ${notification.receivingUser.name}'s #${notification.rank} Top Supporter!`
  },
  [notificationTypes.TipReceive](notification) {
    return `${capitalize(notification.sendingUser.name)} sent you a tip of ${
      notification.amount
    } $AUDIO`
  },
  [notificationTypes.SupporterDethroned](notification) {
    return `${capitalize(
      notification.newTopSupporter.handle
    )} dethroned you as ${
      notification.supportedUser.name
    }'s #1 Top Supporter! Tip to reclaim your spot?`
  }
}

module.exports = {
  challengeInfoMap,
  getRankSuffix,
  formatEmailNotificationProps,
  notificationResponseMap,
  notificationResponseTitleMap,
  pushNotificationMessagesMap
}
