import { ID } from '@audius/common'

import { ChallengeRewardID } from 'common/models/AudioRewards'
import { BadgeTier } from 'common/models/BadgeTier'
import { Collection } from 'common/models/Collection'
import Status from 'common/models/Status'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'
import { StringWei } from 'common/models/Wallet'
import { Nullable } from 'common/utils/typeUtils'

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

export type Announcement = BaseNotification & {
  type: NotificationType.Announcement
  title: string
  shortDescription: string
  longDescription?: string
}

export type UserSubscription = BaseNotification & {
  type: NotificationType.UserSubscription
  userId: ID
  entityIds: ID[]
  user: User
} & (
    | {
        entityType: Entity.Track
        entities: Array<TrackEntity>
      }
    | {
        entityType: Entity.Playlist | Entity.Album
        entities: Array<CollectionEntity>
      }
  )

export type Follow = BaseNotification & {
  type: NotificationType.Follow
  userIds: ID[]
  users: User[]
}

export type Repost = BaseNotification & {
  type: NotificationType.Repost
  entityId: ID
  userIds: ID[]
  users: User[]
} & (
    | {
        entityType: Entity.Playlist | Entity.Album
        entity: CollectionEntity
      }
    | {
        entityType: Entity.Track
        entity: TrackEntity
      }
  )

export type Favorite = BaseNotification & {
  type: NotificationType.Favorite
  entityId: ID
  userIds: ID[]
  users: User[]
} & (
    | {
        entityType: Entity.Playlist | Entity.Album
        entity: CollectionEntity
      }
    | {
        entityType: Entity.Track
        entity: TrackEntity
      }
  )

export enum Achievement {
  Listens = 'Listens',
  Favorites = 'Favorites',
  Reposts = 'Reposts',
  Trending = 'Trending',
  Followers = 'Followers'
}

export type Milestone = BaseNotification & { user: User } & (
    | {
        type: NotificationType.Milestone
        entityType: Entity
        entityId: ID
        entity: EntityType
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

export type RemixCreate = BaseNotification & {
  type: NotificationType.RemixCreate
  userId: ID
  parentTrackId: ID
  childTrackId: ID
  entityType: Entity.Track
  entityIds: ID[]
  user: User
  entities: Array<TrackEntity>
}

export type RemixCosign = BaseNotification & {
  type: NotificationType.RemixCosign
  userId: ID
  parentTrackUserId: ID
  childTrackId: ID
  entityType: Entity.Track
  entityIds: ID[]
  user: User
  entities: Array<TrackEntity>
}

export type TrendingTrack = BaseNotification & {
  type: NotificationType.TrendingTrack
  rank: number
  genre: string
  time: 'week' | 'month' | 'year'
  entityType: Entity.Track
  entityId: ID
  entity: TrackEntity
}

export type ChallengeReward = BaseNotification & {
  type: NotificationType.ChallengeReward
  challengeId: ChallengeRewardID
}

export type TierChange = BaseNotification & {
  type: NotificationType.TierChange
  userId: ID
  tier: BadgeTier
  user: User
}

// TODO: when we support multiple reaction types, reactedToEntity type
// should differ in a discrimated union reactionType
export type Reaction = BaseNotification & {
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
  user: User
}

export type TipReceive = BaseNotification & {
  type: NotificationType.TipReceive
  amount: StringWei
  reactionValue: number
  entityId: ID
  entityType: Entity.User
  tipTxSignature: string
  user: User
}

export type TipSend = BaseNotification & {
  type: NotificationType.TipSend
  amount: StringWei
  entityId: ID
  entityType: Entity.User
  user: User
}

export type SupporterRankUp = BaseNotification & {
  type: NotificationType.SupporterRankUp
  rank: number
  entityId: ID
  entityType: Entity.User
  user: User
}

export type SupportingRankUp = BaseNotification & {
  type: NotificationType.SupportingRankUp
  rank: number
  entityId: ID
  entityType: Entity.User
  user: User
}

export type AddTrackToPlaylist = BaseNotification & {
  type: NotificationType.AddTrackToPlaylist
  trackId: ID
  playlistId: ID
  playlistOwnerId: ID
  entities: {
    playlist: CollectionEntity
    track: TrackEntity
  }
}

export type Notification =
  | Announcement
  | UserSubscription
  | Follow
  | Repost
  | Favorite
  | Milestone
  | RemixCreate
  | RemixCosign
  | TrendingTrack
  | ChallengeReward
  | TierChange
  | Reaction
  | TipReceive
  | TipSend
  | SupporterRankUp
  | SupportingRankUp
  | AddTrackToPlaylist

export default interface NotificationState {
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
