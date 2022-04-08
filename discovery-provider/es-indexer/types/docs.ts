import { PlaylistRow, TrackRow, UserRow } from './db'

export type PlaylistDoc = PlaylistRow & {
  tracks: TrackRow[]
  save_count: number
  saved_by: number[]
  repost_count: number
  reposted_by: number[]
}

export type UserDoc = UserRow & {
  tracks: TrackRow[]
  track_count: number

  following_ids: number[]
  following_count: number
}

export type TrackDoc = TrackRow & {
  reposted_by: number[]
  saved_by: number[]
  routes: string[]
  tags: any // todo: is it a string or a string[]?
  repost_count: number
  save_count: number
}
