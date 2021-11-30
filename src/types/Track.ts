import { FullUser, User } from './User'

export type TrackArtwork = {
  ['150x150']?: string
  ['480x480']?: string
  ['1000x1000']?: string
}

export type RemixParent = {
  tracks: Array<{ parent_track_id: number }>
}

export type Track = {
  artwork: TrackArtwork,
  description: string
  genre?: string
  id: string
  mood?: string
  release_date: string
  remix_of: RemixParent
  repost_count?: number
  favorite_count?: number
  tags?: string
  title: string
  user: User
  duration: number
  downloadable?: boolean
  play_count?: number
  permalink?: string
}

export type TrackDownload = {
  cid: string
  is_downloadable: string
  requires_follow: string
}

export type TrackFieldVisibility = {
  mood: boolean
  tags: boolean
  genre: boolean
  share: boolean
  play_count: boolean
  remixes: boolean
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
  category: string
  parent_track_id: number
}

export type TrackSegment = {
  duration: number
  multihash: string
}

export type FullRemixParent = {
  parent_track_id: string
  user: FullUser
  has_remix_author_reposted: boolean
  has_remix_author_saved: boolean
}

export type FullTrack = Track & {
  blocknumber: number
  create_date: string
  cover_art_sizes: string
  created_at: string
  credits_splits: string
  download: TrackDownload
  isrc: string
  license: string
  iswc: string
  field_visibility: TrackFieldVisibility
  followee_reposts: Repost[]
  has_current_user_reposted: boolean
  is_unlisted: boolean
  has_current_user_saved: boolean
  followee_favorites: Favorite[]
  route_id: string
  stem_of: StemParent[]
  track_segments: TrackSegment[]
  updated_at: string
  user_id: string
  user: FullUser
  is_delete: boolean
  cover_art: string
  remix_of: FullRemixParent
}

export type TrackModel = {
  blockhash: string
  blocknumber: number
  txhash: string
  track_id: number
  is_current: boolean
  is_delete: boolean
  owner_id: number
  route_id: string
  title: string
  length: number
  cover_art: string
  cover_art_sizes: string
  tags: string
  genre: string
  mood: string
  credits_splits: string
  remix_of: any
  create_date: string
  release_date: string
  file_type: string
  description: string
  license: string
  isrc: string
  iswc: string
  track_segments: any
  metadata_multihash: string
  download: any
  updated_at: string
  created_at: string
  is_unlisted: boolean
  field_visibility: TrackFieldVisibility
  stem_of: any
  permalink: string
  user: FullUser
}
