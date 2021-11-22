import { ChallengeRewardID } from 'common/models/AudioRewards'
import { Collection } from 'common/models/Collection'
import { ID } from 'common/models/Identifiers'
import Status from 'common/models/Status'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'
import { BadgeTier } from 'containers/user-badges/utils'

import {
  getNotificationEntities,
  getNotificationEntity,
  getNotificationUser,
  getNotificationUsers
} from './selectors'

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
  TierChange = 'TierChange'
}

export enum Entity {
  Track = 'Track',
  Playlist = 'Playlist',
  Album = 'Album',
  User = 'User'
}

export type BaseNotification = {
  id: string
  isRead: boolean
  isHidden: boolean
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
  user?: User
} & (
    | {
        entityType: Entity.Track
        entities?: Array<Track & { user: User }>
      }
    | {
        entityType: Entity.Playlist | Entity.Album
        entities?: Array<Collection & { user: User }>
      }
  )

export type Follow = BaseNotification & {
  type: NotificationType.Follow
  userIds: ID[]
  users?: User[]
}

export type Repost = BaseNotification & {
  type: NotificationType.Repost
  entityId: ID
  userIds: ID[]
  users?: User[]
} & (
    | {
        entityType: Entity.Playlist | Entity.Album
        entity?: Collection & { user: User }
      }
    | {
        entityType: Entity.Track
        entity?: Track & { user: User }
      }
  )

export type Favorite = BaseNotification & {
  type: NotificationType.Favorite
  entityId: ID
  userIds: ID[]
} & (
    | {
        entityType: Entity.Playlist | Entity.Album
        entity: Collection & { user: User }
      }
    | {
        entityType: Entity.Track
        entity: Track & { user: User }
      }
  )

export enum Achievement {
  Listens = 'Listens',
  Favorites = 'Favorites',
  Reposts = 'Reposts',
  Trending = 'Trending',
  Followers = 'Followers'
}

export type Milestone = BaseNotification &
  (
    | {
        type: NotificationType.Milestone
        entityType: Entity
        entityId: ID
        entity: User | Track | Collection
        achievement: Exclude<Achievement, Achievement.Followers>
        value?: number
      }
    | {
        type: NotificationType.Milestone
        entityId: ID
        achievement: Achievement.Followers
        value?: number
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
  entities: Array<Track & { user: User }>
}

export type RemixCosign = BaseNotification & {
  type: NotificationType.RemixCosign
  userId: ID
  parentTrackUserId: ID
  childTrackId: ID
  entityType: Entity.Track
  entityIds: ID[]
  user: User
  entities: Array<Track & { user: User }>
}

export type TrendingTrack = BaseNotification & {
  type: NotificationType.TrendingTrack
  rank: number
  genre: string
  time: 'week' | 'month' | 'year'
  entityType: Entity.Track
  entityId: ID
  entity: Track & { user: User }
}

export type ChallengeReward = BaseNotification & {
  type: NotificationType.ChallengeReward
  challengeId: ChallengeRewardID
}

export type TierChange = BaseNotification & {
  type: NotificationType.TierChange
  tier: BadgeTier
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
  totalUnread: number
  status?: Status
  hasMore: boolean
  hasLoaded: boolean
  playlistUpdates: number[]
}

export type ConnectedNotification = Notification & {
  user: ReturnType<typeof getNotificationUser>
  users: ReturnType<typeof getNotificationUsers>
  entity: ReturnType<typeof getNotificationEntity>
  entities: ReturnType<typeof getNotificationEntities>
}
