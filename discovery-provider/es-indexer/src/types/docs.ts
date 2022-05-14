import {
  FollowRow,
  PlaylistRow,
  RepostRow,
  SaveRow,
  TrackRow,
  UserRow,
} from './db'

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
  tags: string // comma separated
  repost_count: number
  favorite_count: number
  play_count: any // todo: is it a string or number?  pg returns string

  user: {
    handle: string
    name: string
    location: string
    follower_count: number
  }
}

export type RepostDoc = RepostRow & {
  item_key: string
  repost_id: string
}

export type SaveDoc = SaveRow & {
  item_key: string
  save_id: string
}

export type FollowDoc = FollowRow & {
  follow_id: string
}
