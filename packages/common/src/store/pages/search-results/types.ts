import { LineupState, Track } from '../../../models'

export type SearchPageState = {
  tracks: LineupState<Track>
}

export enum SearchKind {
  TRACKS = 'tracks',
  USERS = 'users',
  PLAYLISTS = 'playlists',
  ALBUMS = 'albums',
  ALL = 'all'
}

export type SearchSortMethod = 'relevant' | 'popular' | 'recent'
