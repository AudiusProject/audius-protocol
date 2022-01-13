import { ID } from 'common/models/Identifiers'
import Status from 'common/models/Status'
import { LineupState } from 'models/common/Lineup'

export type SearchPageState = {
  status: Status
  searchText: string
  trackIds: ID[]
  albumIds: ID[]
  playlistIds: ID[]
  artistIds: ID[]
  tracks: LineupState<{ id: ID }>
}

export enum SearchKind {
  TRACKS = 'tracks',
  USERS = 'users',
  PLAYLISTS = 'playlists',
  ALBUMS = 'albums',
  ALL = 'all'
}
