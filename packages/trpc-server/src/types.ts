import {
  AggregatePlaylistRow,
  AggregateTrackRow,
  AggregateUserRow,
  PlaylistRow,
  TrackRow,
  UserRow,
} from './db-tables'

export type AUser = UserRow & AggregateUserRow
export type ATrack = TrackRow & AggregateTrackRow
export type APlaylist = PlaylistRow & AggregatePlaylistRow
