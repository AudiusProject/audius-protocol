import { ID } from '@audius/common'

import { LineupState } from 'common/models/Lineup'
import Status from 'common/models/Status'
import { Track } from 'common/models/Track'

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
