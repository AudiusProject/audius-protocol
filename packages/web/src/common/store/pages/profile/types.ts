import { ID, UID } from '@audius/common'

import { LineupState } from 'common/models/Lineup'
import Status from 'common/models/Status'
import { User } from 'common/models/User'

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

export type Follow = {
  userIds: Array<{ id: ID; uid: UID }>
  status: Status
}

export type ProfilePageState = {
  handle: string
  userId: number
  status: Status
  updating: boolean
  updateSuccess: boolean
  updateError: boolean
  collectionIds: number[]
  mustUsedTags: string[]
  collectionSortMode: CollectionSortMode
  profileMeterDismissed: boolean
  followers: Follow
  followees: Follow
  followeeFollows: Follow
  feed: LineupState<{ id: ID }>
  tracks: LineupState<{ id: ID }>
  isNotificationSubscribed: boolean
  error?: string
  mostUsedTags: string[]
}

export enum Tabs {
  TRACKS = 'TRACKS',
  ALBUMS = 'ALBUMS',
  PLAYLISTS = 'PLAYLISTS',
  REPOSTS = 'REPOSTS',
  COLLECTIBLES = 'COLLECTIBLES'
}

export enum TabRoute {
  TRACKS = 'tracks',
  ALBUMS = 'albums',
  PLAYLISTS = 'playlists',
  REPOSTS = 'reposts',
  COLLECTIBLES = 'collectibles'
}

export const getTabForRoute = (tabRoute: TabRoute) => {
  switch (tabRoute) {
    case TabRoute.TRACKS:
      return Tabs.TRACKS
    case TabRoute.ALBUMS:
      return Tabs.ALBUMS
    case TabRoute.PLAYLISTS:
      return Tabs.PLAYLISTS
    case TabRoute.REPOSTS:
      return Tabs.REPOSTS
    case TabRoute.COLLECTIBLES:
      return Tabs.COLLECTIBLES
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
