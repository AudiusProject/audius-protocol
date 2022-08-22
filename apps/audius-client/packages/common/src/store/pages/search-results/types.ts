import { ID, LineupState, Status, Track } from '../../../models'

export type SearchPageState = {
  status: Status
  searchText: string
  trackIds: ID[]
  albumIds: ID[]
  playlistIds: ID[]
  artistIds: ID[]
  tracks: LineupState<Track>
}

export enum SearchKind {
  TRACKS = 'tracks',
  USERS = 'users',
  PLAYLISTS = 'playlists',
  ALBUMS = 'albums',
  ALL = 'all'
}
