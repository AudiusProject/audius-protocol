import { ID, UID, Collectible, Track, User } from '@audius/common'

export enum RepeatMode {
  OFF = 'OFF',
  ALL = 'ALL',
  SINGLE = 'SINGLE'
}

export enum Source {
  COLLECTION_TRACKS = 'COLLECTION_TRACKS',
  DISCOVER_FEED = 'DISCOVER_FEED',
  DISCOVER_TRENDING = 'DISCOVER_TRENDING',
  HISTORY_TRACKS = 'HISTORY_TRACKS',
  COLLECTIBLE_PLAYLIST_TRACKS = 'COLLECTIBLE_PLAYLIST_TRACKS',
  PROFILE_FEED = 'PROFILE_FEED',
  PROFILE_TRACKS = 'PROFILE_TRACKS',
  SAVED_TRACKS = 'SAVED_TRACKS',
  SEARCH_TRACKS = 'SEARCH_TRACKS',
  TRACK_TRACKS = 'TRACK_TRACKS',
  RECOMMENDED_TRACKS = 'RECOMMENDED_TRACKS'
}

export type Queueable = {
  id: ID | string
  uid: UID
  artistId?: ID
  collectible?: Collectible
  source: Source
}

export type QueueItem = {
  uid: UID | null
  source: Source | null
  track: Track | null
  user: User | null
}
