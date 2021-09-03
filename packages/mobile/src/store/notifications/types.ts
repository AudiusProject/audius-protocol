import User from '../../models/User'
import Track from '../../models/Track'
import Collection from '../../models/Collection'

export type ID = number

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
  ChallengeReward = 'ChallengeReward'
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
  isViewed: boolean
  isHidden: boolean
  timestamp: string
  timeLabel?: string
  user: any
  users: any
  entity: any
  entities: any
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

export type ChallengeRewardID =
  | 'track-upload'
  | 'referrals'
  | 'referred'
  | 'mobile-install'
  | 'connect-verified'
  | 'listen-streak'
  | 'profile-completion'

export type ChallengeReward = BaseNotification & {
  type: NotificationType.ChallengeReward
  challengeId: ChallengeRewardID
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
