import { ID } from 'common/models/Identifiers'
import { LineupState } from 'common/models/Lineup'
import Status from 'common/models/Status'

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
