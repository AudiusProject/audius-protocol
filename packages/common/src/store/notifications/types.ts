import { Nullable } from 'utils'

import {
  ID,
  ChallengeRewardID,
  BadgeTier,
  Collection,
  Status,
  Track,
  User,
  StringWei
} from '../../models'

import {
  fetchNotifications,
  fetchNotificationsRequested,
  fetchNotificationsFailed,
  fetchNotificationSucceeded,
  refreshNotifications,
  setNotifications,
  setNotificationUsers,
  fetchNotificationUsers,
  fetchNotificationUsersRequested,
  fetchNotificationUsersFailed,
  fetchNotificationUsersSucceeded,
  setTotalUnviewedToZero,
  markAllAsViewed,
  setNotificationModal,
  toggleNotificationPanel,
  subscribeUser,
  unsubscribeUser,
  setPlaylistUpdates,
  updatePlaylistLastViewedAt
} from './actions'

export enum NotificationType {
  Announcement = 'Announcement',
  UserSubscription = 'UserSubscription',
  Follow = 'Follow',
  Favorite = 'Favorite',
  Repost = 'Repost',
  Milestone = 'Milestone',
  RemixCreate = 'RemixCreate',
  RemixCosign = 'RemixCosign',
  TrendingTrack = 'TrendingTrack',
  ChallengeReward = 'ChallengeReward',
  TierChange = 'TierChange',
  Reaction = 'Reaction',
  TipReceive = 'TipReceive',
  TipSend = 'TipSend',
  SupporterRankUp = 'SupporterRankUp',
  SupportingRankUp = 'SupportingRankUp',
  AddTrackToPlaylist = 'AddTrackToPlaylist',
  SupporterDethroned = 'SupporterDethroned'
}

export enum PushNotificationType {
  Follow = 'Follow',
  FavoriteTrack = 'FavoriteTrack',
  FavoritePlaylist = 'FavoritePlaylist',
  FavoriteAlbum = 'FavoriteAlbum',
  RepostTrack = 'RepostTrack',
  RepostPlaylist = 'RepostPlaylist',
  RepostAlbum = 'RepostAlbum',
  MilestoneListen = 'MilestoneListen',
  MilestoneRepost = 'MilestoneRepost',
  MilestoneFavorite = 'MilestoneFavorite',
  MilestoneFollow = 'MilestoneFollow',
  CreateTrack = 'CreateTrack',
  CreatePlaylist = 'CreatePlaylist',
  CreateAlbum = 'CreateAlbum',
  Announcement = 'Announcement',
  RemixCreate = 'RemixCreate',
  RemixCosign = 'RemixCosign',
  TrendingTrack = 'TrendingTrack',
  ChallengeReward = 'ChallengeReward',
  TierChange = 'TierChange',
  PlaylistUpdate = 'PlaylistUpdate',
  Tip = 'Tip',
  TipReceive = 'TipReceive',
  TipSend = 'TipSend',
  Reaction = 'Reaction',
  SupporterRankUp = 'SupporterRankUp',
  SupportingRankUp = 'SupportingRankUp',
  SupporterDethroned = 'SupporterDethroned',
  AddTrackToPlaylist = 'AddTrackToPlaylist'
}

export enum Entity {
  Track = 'Track',
  Playlist = 'Playlist',
  Album = 'Album',
  User = 'User'
}

export type TrackEntity = Track & { user: Nullable<User> }

export type CollectionEntity = Collection & { user: Nullable<User> }

export type EntityType = TrackEntity | CollectionEntity

export type BaseNotification = {
  id: string
  isViewed: boolean
  timestamp: string
  timeLabel?: string
}

export type AnnouncementNotification = BaseNotification & {
  type: NotificationType.Announcement
  title: string
  shortDescription: string
  longDescription?: string
}

export type UserSubscriptionNotification = BaseNotification & {
  type: NotificationType.UserSubscription
  userId: ID
  entityIds: ID[]
} & (
    | {
        entityType: Entity.Track
      }
    | {
        entityType: Entity.Playlist | Entity.Album
      }
  )

export type FollowNotification = BaseNotification & {
  type: NotificationType.Follow
  userIds: ID[]
}

export type FollowPushNotification = {
  type: PushNotificationType.Follow
  actions: [
    {
      blocknumber: number
      actionEntityId: ID
      actionEntityType: Entity.User
    }
  ]
  initiator: ID
  blocknumber: ID
  timestamp: string
  metadata: {
    followee_user_id: ID
    follower_user_id: ID
  }
}

export type RepostNotification = BaseNotification & {
  type: NotificationType.Repost
  entityId: ID
  userIds: ID[]
  entityType: Entity.Playlist | Entity.Album | Entity.Track
}

export type RepostPushNotification = {
  blocknumber: number
  entityId: ID
  initiator: ID
  timestamp: string
  type:
    | PushNotificationType.RepostAlbum
    | PushNotificationType.RepostPlaylist
    | PushNotificationType.RepostTrack
  actions: [
    {
      blocknumber: number
      actionEntityId: ID
      actionEntityType: Entity.User
    }
  ]
  metadata: {
    entity_owner_id: ID
    entity_type: Entity.Album | Entity.Playlist | Entity.Track
    entity_id: ID
  }
}

export type FavoriteNotification = BaseNotification & {
  type: NotificationType.Favorite
  entityId: ID
  userIds: ID[]
  entityType: Entity.Playlist | Entity.Album | Entity.Track
}

export type FavoritePushNotification = {
  blocknumber: number
  entityId: ID
  initiator: ID
  timestamp: string
  type:
    | PushNotificationType.FavoriteAlbum
    | PushNotificationType.FavoritePlaylist
    | PushNotificationType.FavoriteTrack
  actions: [
    {
      blocknumber: number
      actionEntityId: ID
      actionEntityType: Entity.User
    }
  ]
  metadata: {
    entity_owner_id: ID
    entity_type: Entity.Album | Entity.Playlist | Entity.Track
    entity_id: ID
  }
}

export enum Achievement {
  Listens = 'Listens',
  Favorites = 'Favorites',
  Reposts = 'Reposts',
  Trending = 'Trending',
  Followers = 'Followers'
}

export type MilestoneNotification = BaseNotification &
  (
    | {
        type: NotificationType.Milestone
        entityType: Entity
        entityId: ID
        achievement: Exclude<Achievement, Achievement.Followers>
        value: number
      }
    | {
        type: NotificationType.Milestone
        entityId: ID
        achievement: Achievement.Followers
        value: number
      }
  )

export type MilestoneFollowPushNotification = {
  // TODO: Not the full structure. Need to verify the fields that come back from identity
  initiator: ID
  slot: number
  type: PushNotificationType.MilestoneFollow
}

export type MilestoneListenPushNotification = {
  actions: [
    {
      // NOTE: This is actually the milestone value, not the id
      actionEntityId: number
      actionEntityType: Entity.Track | Entity.Album | Entity.Playlist
    }
  ]
  initiator: ID
  entityId: ID
  slot: number
  type: PushNotificationType.MilestoneListen
  metadata: {
    threshold: number
    entity_type: Entity
    entity_id: ID
  }
}

export type MilestoneRepostPushNotification = {
  actions: [
    {
      // NOTE: This is actually the milestone value, not the id
      actionEntityId: number
      actionEntityType: Entity.Track | Entity.Album | Entity.Playlist
    }
  ]
  initiator: ID
  entityId: ID
  slot: number
  type: PushNotificationType.MilestoneRepost
  metadata: {
    threshold: number
    entity_type: Entity
    entity_id: ID
  }
}

export type MilestoneFavoritePushNotification = {
  actions: [
    {
      // NOTE: This is actually the milestone value, not the id
      actionEntityId: number
      actionEntityType: Entity.Track | Entity.Album | Entity.Playlist
    }
  ]
  initiator: ID
  entityId: ID
  slot: number
  type: PushNotificationType.MilestoneFavorite
  metadata: {
    threshold: number
    entity_type: Entity
    entity_id: ID
  }
}

export type RemixCreateNotification = BaseNotification & {
  type: NotificationType.RemixCreate
  userId: ID
  parentTrackId: ID
  childTrackId: ID
  entityType: Entity.Track
  entityIds: ID[]
}

export type RemixCreatePushNotification = {
  type: PushNotificationType.RemixCreate
  entityId: ID
  actions: [
    // Parent Track User
    {
      actionEntityType: Entity.User
      actionEntityId: ID
      blocknumber: number
    },
    // Remixed Track
    {
      actionEntityType: Entity.Track
      actionEntityId: ID
      blocknumber: number
    },
    // Parent Track
    {
      actionEntityType: Entity.Track
      actionEntityId: ID
      blocknumber: number
    }
  ]
}

export type RemixCosignNotification = BaseNotification & {
  type: NotificationType.RemixCosign
  userId: ID
  parentTrackUserId: ID
  childTrackId: ID
  entityType: Entity.Track
  entityIds: ID[]
}

export type RemixCosignPushNotification = {
  type: PushNotificationType.RemixCosign
  entityId: ID
  actions: [
    {
      actionEntityType: Entity.User
      actionEntityId: ID
      blocknumber: number
    },
    {
      actionEntityType: Entity.Track
      actionEntityId: ID
      blocknumber: number
    }
  ]
}

export type TrendingTrackNotification = BaseNotification & {
  type: NotificationType.TrendingTrack
  rank: number
  genre: string
  time: 'week' | 'month' | 'year'
  entityType: Entity.Track
  entityId: ID
}

export type ChallengeRewardNotification = BaseNotification & {
  type: NotificationType.ChallengeReward
  challengeId: ChallengeRewardID
}

export type TierChangeNotification = BaseNotification & {
  type: NotificationType.TierChange
  userId: ID
  tier: BadgeTier
}

// TODO: when we support multiple reaction types, reactedToEntity type
// should differ in a discrimated union reactionType
export type ReactionNotification = BaseNotification & {
  type: NotificationType.Reaction
  entityId: ID
  entityType: Entity.User
  reactionValue: number
  reactionType: string
  reactedToEntity: {
    tx_signature: string
    amount: StringWei
    tip_sender_id: ID
  }
}

export type ReactionPushNotification = {
  type: PushNotificationType.Reaction
  initiator: ID
  slot: number
  metadata: {
    // TODO: Need to verify camelCase vs snake_case
    reaction_value: number
    reacted_to_entity: {
      tx_signature: string
      tip_sender_id: ID
      amount: string
    }
    reaction_type: string
  }
}

export type TipReceiveNotification = BaseNotification & {
  type: NotificationType.TipReceive
  amount: StringWei
  reactionValue: number
  entityId: ID
  entityType: Entity.User
  tipTxSignature: string
}

export type TipReceivePushNotification = {
  type: PushNotificationType.TipReceive
  slot: number
  initiator: ID
  metadata: {
    // TODO: Need to verify camelCase vs snake_case
    entityId: ID
    entityType: Entity.User
    amount: StringWei
    tipTxSignature: string
  }
}

export type TipSendNotification = BaseNotification & {
  type: NotificationType.TipSend
  amount: StringWei
  entityId: ID
  entityType: Entity.User
}

export type TipSendPushNotification = {
  type: PushNotificationType.TipSend
  slot: number
  initiator: ID
  metadata: {
    // TODO: Need to verify camelCase vs snake_case
    entityId: ID
    entityType: Entity.User
    amount: StringWei
    tipTxSignature: string
  }
}

export type SupporterRankUpNotification = BaseNotification & {
  type: NotificationType.SupporterRankUp
  rank: number
  entityId: ID
  entityType: Entity.User
}

export type SupporterRankUpPushNotification = {
  initiator: ID
  slot: number
  type: PushNotificationType.SupporterRankUp
  metadata: {
    rank: number
    entity_type: Entity.User
    entity_id: ID
  }
}

export type SupportingRankUpNotification = BaseNotification & {
  type: NotificationType.SupportingRankUp
  rank: number
  entityId: ID
  entityType: Entity.User
}

export type SupportingRankUpPushNotification = {
  initiator: ID
  slot: number
  type: PushNotificationType.SupportingRankUp
  metadata: {
    rank: number
    entity_type: Entity.User
    entity_id: ID
  }
}

export type SupporterDethronedNotification = BaseNotification & {
  type: NotificationType.SupporterDethroned
  entityType: Entity.User
  entityId: ID // The usurping user
  supportedUserId: ID
  // Not currently used:
  // newAmount	"3000000000000000000"
  // oldAmount	"2000000000000000000"
}

export type AddTrackToPlaylistNotification = BaseNotification & {
  type: NotificationType.AddTrackToPlaylist
  trackId: ID
  playlistId: ID
  playlistOwnerId: ID
}

export type AddTrackToPlaylistPushNotification = {
  type: PushNotificationType.AddTrackToPlaylist
  entityId: ID
  metadata: {
    // TODO: Need to verify camelCase vs snake_case
    playlistId: ID
    trackOwnerId: ID
    playlistOwnerId: ID
  }
}

export type Notification =
  | AnnouncementNotification
  | UserSubscriptionNotification
  | FollowNotification
  | RepostNotification
  | FavoriteNotification
  | MilestoneNotification
  | RemixCreateNotification
  | RemixCosignNotification
  | TrendingTrackNotification
  | ChallengeRewardNotification
  | TierChangeNotification
  | ReactionNotification
  | TipReceiveNotification
  | TipSendNotification
  | SupporterRankUpNotification
  | SupportingRankUpNotification
  | SupporterDethronedNotification
  | AddTrackToPlaylistNotification

export interface NotificationState {
  notifications: {
    [id: string]: Notification
  }
  userList: {
    userIds: ID[]
    status?: Status
    limit: number
  }
  lastTimeStamp?: string
  allIds: string[]
  modalNotificationId: string | undefined
  panelIsOpen: boolean
  modalIsOpen: boolean
  totalUnviewed: number
  status?: Status
  hasMore: boolean
  hasLoaded: boolean
  playlistUpdates: number[]
}

export type FetchNotifications = ReturnType<typeof fetchNotifications>
export type FetchNotificationsRequested = ReturnType<
  typeof fetchNotificationsRequested
>
export type FetchNotificationsFailed = ReturnType<
  typeof fetchNotificationsFailed
>
export type FetchNotificationsSucceeded = ReturnType<
  typeof fetchNotificationSucceeded
>
export type RefreshNotifications = ReturnType<typeof refreshNotifications>
export type SetNotifications = ReturnType<typeof setNotifications>
export type SetNotificationUsers = ReturnType<typeof setNotificationUsers>
export type FetchNotificationUsers = ReturnType<typeof fetchNotificationUsers>
export type FetchNotificationUsersRequested = ReturnType<
  typeof fetchNotificationUsersRequested
>
export type FetchNotificationUsersFailed = ReturnType<
  typeof fetchNotificationUsersFailed
>
export type FetchNotificationUsersSucceeded = ReturnType<
  typeof fetchNotificationUsersSucceeded
>
export type SetTotalUnviewedToZero = ReturnType<typeof setTotalUnviewedToZero>
export type MarkAllAsViewed = ReturnType<typeof markAllAsViewed>
export type SetNotificationModal = ReturnType<typeof setNotificationModal>
export type ToggleNotificationPanel = ReturnType<typeof toggleNotificationPanel>
export type SubscribeUser = ReturnType<typeof subscribeUser>
export type UnsubscribeUser = ReturnType<typeof unsubscribeUser>
export type SetPlaylistUpdates = ReturnType<typeof setPlaylistUpdates>
export type UpdatePlaylistLastViewedAt = ReturnType<
  typeof updatePlaylistLastViewedAt
>

export type NotificationAction =
  | FetchNotifications
  | FetchNotificationsRequested
  | FetchNotificationsFailed
  | FetchNotificationsSucceeded
  | RefreshNotifications
  | SetNotifications
  | SetNotificationUsers
  | FetchNotificationUsers
  | FetchNotificationUsersRequested
  | FetchNotificationUsersFailed
  | FetchNotificationUsersSucceeded
  | SetTotalUnviewedToZero
  | MarkAllAsViewed
  | SetNotificationModal
  | ToggleNotificationPanel
  | SubscribeUser
  | UnsubscribeUser
  | SetPlaylistUpdates
  | UpdatePlaylistLastViewedAt
