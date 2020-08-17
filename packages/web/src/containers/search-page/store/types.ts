import { ID } from 'models/common/Identifiers'
import { LineupState } from 'models/common/Lineup'
import { Status } from 'store/types'

type SearchPageState = {
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

export default SearchPageState
