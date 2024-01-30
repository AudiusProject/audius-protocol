import type { ID, UID, LineupState, Status, User } from '../../../models'
import type { Nullable } from '../../../utils/typeUtils'

export enum FollowType {
  FOLLOWERS = 'followers',
  FOLLOWEES = 'followees',
  FOLLOWEE_FOLLOWS = 'followeeFollows'
}

export enum CollectionSortMode {
  TIMESTAMP = 0,
  SAVE_COUNT = 1
}

export enum TracksSortMode {
  RECENT = 0,
  POPULAR = 1
}

export type ProfilePageFollow = {
  userIds: { id: ID; uid?: UID }[]
  status: Status
}

export type ProfileState = {
  handle: string
  userId: number
  status: Status
  updating: boolean
  updateSuccess: boolean
  updateError: boolean
  collectionIds: number[]
  collectionStatus: Status
  topTagsStatus: Status
  topTags: string[]
  collectionSortMode: CollectionSortMode
  profileMeterDismissed: boolean
  followers: ProfilePageFollow
  followees: ProfilePageFollow
  followeeFollows: ProfilePageFollow
  feed: LineupState<{ id: ID }>
  tracks: LineupState<{ id: ID }>
  isNotificationSubscribed: boolean
  error?: string
}

export type ProfilePageState = {
  currentUser: Nullable<string>
  entries: Record<string, ProfileState>
}

export enum ProfilePageTabs {
  TRACKS = 'TRACKS',
  ALBUMS = 'ALBUMS',
  PLAYLISTS = 'PLAYLISTS',
  REPOSTS = 'REPOSTS',
  COLLECTIBLES = 'COLLECTIBLES'
}

export enum ProfilePageTabRoute {
  TRACKS = 'tracks',
  ALBUMS = 'albums',
  PLAYLISTS = 'playlists',
  REPOSTS = 'reposts',
  COLLECTIBLES = 'collectibles'
}

export const getTabForRoute = (tabRoute: ProfilePageTabRoute) => {
  switch (tabRoute) {
    case ProfilePageTabRoute.TRACKS:
      return ProfilePageTabs.TRACKS
    case ProfilePageTabRoute.ALBUMS:
      return ProfilePageTabs.ALBUMS
    case ProfilePageTabRoute.PLAYLISTS:
      return ProfilePageTabs.PLAYLISTS
    case ProfilePageTabRoute.REPOSTS:
      return ProfilePageTabs.REPOSTS
    case ProfilePageTabRoute.COLLECTIBLES:
      return ProfilePageTabs.COLLECTIBLES
  }
}

type FollowerGroup = {
  status: Status
  users: User[]
}
export interface ProfileUser extends User {
  followers: FollowerGroup
  followees: FollowerGroup
}
