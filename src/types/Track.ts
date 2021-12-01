import { FullUser, User, UserModel } from './User'

// The general case models come from the "/v1" routes
export type TrackArtwork = {
  ['150x150']: string | null
  ['480x480']: string | null
  ['1000x1000']: string
}

export type RemixOf<T> = {
  tracks: T[]
}

export type RemixParent = {
  parent_track_id: string
}

export type Track = {
  artwork: TrackArtwork,
  description: string
  downloadable: boolean
  duration: number
  favorite_count: number
  genre: string
  id: string
  mood: string
  permalink: string
  play_count: number
  release_date: string
  remix_of: RemixOf<RemixParent> | null
  repost_count: number
  tags: string | null
  title: string
  user: User
}

export type TrackDownload = {
  cid: string | null
  is_downloadable: boolean
  requires_follow: boolean
}

export type TrackFieldVisibility = {
  genre: boolean
  mood: boolean
  play_count: boolean
  remixes: boolean
  share: boolean
  tags: boolean
}

export type Repost = {
  repost_item_id: string
  repost_type: string
  user_id: string
}

export type Favorite = {
  favorite_item_id: string
  favorite_type: string
  user_id: string
}

export type StemParent = {
  category: string | null
  parent_track_id: number | null
}

export type TrackSegment = {
  duration: number
  multihash: string
}

// Prefixed with "full", these models come from the "v1/full" route
export type FullRemixParent = {
  has_remix_author_reposted: boolean
  has_remix_author_saved: boolean
  parent_track_id: string
  user: FullUser
}

export type FullTrack = Track & {
  blocknumber: number
  cover_art_sizes: string
  cover_art: string
  create_date: string
  created_at: string
  credits_splits: string
  download: TrackDownload
  field_visibility: TrackFieldVisibility
  followee_favorites: Favorite[]
  followee_reposts: Repost[]
  has_current_user_reposted: boolean
  has_current_user_saved: boolean
  is_delete: boolean
  is_unlisted: boolean
  isrc: string
  iswc: string
  license: string
  remix_of: RemixOf<FullRemixParent> | null
  route_id: string
  stem_of: StemParent
  track_segments: TrackSegment[]
  updated_at: string
  user_id: string
  user: FullUser
}

// Suffixed with "model", these types come from the non-v1 API routes
export type RemixParentModel = {
  has_remix_author_reposted: boolean
  has_remix_author_saved: boolean
  parent_track_id: number
  user: UserModel
}

export type TrackModel = {
  blockhash: string
  blocknumber: number
  cover_art_sizes: string
  cover_art: string
  create_date: string
  created_at: string
  credits_splits: string
  description: string
  download: TrackDownload
  field_visibility: TrackFieldVisibility
  file_type: string
  followee_reposts: Repost[]
  followee_saves: Favorite[]
  has_current_user_reposted: boolean
  has_current_user_saved: boolean
  genre: string
  is_current: boolean
  is_delete: boolean
  is_unlisted: boolean
  isrc: string
  iswc: string
  length: number
  license: string
  metadata_multihash: string
  mood: string
  owner_id: number
  permalink: string
  play_count: number
  release_date: string
  remix_of: RemixOf<RemixParentModel> | null
  repost_count: number
  route_id: string
  save_count: number
  stem_of: null
  tags: string | null
  title: string
  track_id: number
  track_segments: TrackSegment[]
  txhash: string
  updated_at: string
  user: UserModel
}
