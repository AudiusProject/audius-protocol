import { ID } from 'common/models/Identifiers'

// OverflowActions users can take
export enum OverflowAction {
  REPOST = 'REPOST',
  UNREPOST = 'UNREPOST',
  FAVORITE = 'FAVORITE',
  UNFAVORITE = 'UNFAVORITE',
  SHARE = 'SHARE',
  SHARE_TO_TIKTOK = 'SHARE_TO_TIKTOK',
  ADD_TO_PLAYLIST = 'ADD_TO_PLAYLIST',
  EDIT_PLAYLIST = 'EDIT_PLAYLIST',
  DELETE_PLAYLIST = 'DELETE_PLAYLIST',
  PUBLISH_PLAYLIST = 'PUBLISH_PLAYLIST',
  VIEW_TRACK_PAGE = 'VIEW_TRACK_PAGE',
  VIEW_ARTIST_PAGE = 'VIEW_ARTIST_PAGE',
  VIEW_PLAYLIST_PAGE = 'VIEW_PLAYLIST_PAGE',
  VIEW_ALBUM_PAGE = 'VIEW_ALBUM_PAGE',
  UNSUBSCRIBER_USER = 'UNSUBSCRIBER_USER',
  HIDE_NOTIFICATION = 'HIDE_NOTIFICATION',
  FOLLOW_ARTIST = 'FOLLOW_ARTIST',
  UNFOLLOW_ARTIST = 'UNFOLLOW_ARTIST',
  FOLLOW = 'FOLLOW',
  UNFOLLOW = 'UNFOLLOW'
}

export enum OverflowSource {
  NOTIFICATIONS = 'NOTIFICATIONS',
  TRACKS = 'TRACKS',
  COLLECTIONS = 'COLLECTIONS',
  PROFILE = 'PROFILE'
}

export type OverflowActionCallbacks = {
  [key in OverflowAction]?: () => void
}

export type MobileOverflowModalState = {
  isOpen: boolean
  id: ID | string | null /* Notification IDs can be strings */
  source: OverflowSource
  overflowActions: OverflowAction[]
  overflowActionCallbacks: OverflowActionCallbacks
}
