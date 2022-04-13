import { PlaylistRow, TrackRow, UserRow } from './db'

export type PlaylistDoc = PlaylistRow & {
  tracks: TrackDoc[]
  save_count: number
  saved_by: number[]
  repost_count: number
  reposted_by: number[]
  total_play_count: number
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
  permalink: string
  tags: any // todo: is it a string or a string[]?
  repost_count: number
  save_count: number
  play_count: any // todo: is it a string or number?  pg returns string

  artist: {
    handle: string
    name: string
    location: string
    follower_count: number
  }
}
