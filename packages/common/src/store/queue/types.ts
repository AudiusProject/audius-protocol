import { ID, UID, Collectible, Track, User } from '../../models'

export enum RepeatMode {
  OFF = 'OFF',
  ALL = 'ALL',
  SINGLE = 'SINGLE'
}

export enum QueueSource {
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
  RECOMMENDED_TRACKS = 'RECOMMENDED_TRACKS',
  CHAT_TRACKS = 'CHAT_TRACKS',
  CHAT_PLAYLIST_TRACKS = 'CHAT_PLAYLIST_TRACKS'
}

export type Queueable = {
  id: ID | string
  uid: UID
  artistId?: ID
  collectible?: Collectible
  isPreview?: boolean
  source: QueueSource
}

export type QueueItem = {
  uid: UID | null
  source: QueueSource | null
  track: Track | null
  user: User | null
}
