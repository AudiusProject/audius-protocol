import { Nullable } from 'utils/typeUtils'

import { CID } from 'models/common/Identifiers'
import {
  CoverArtSizes,
  CoverPhotoSizes,
  ProfilePictureSizes
} from 'models/common/ImageSizes'
import { FavoriteType } from 'models/Favorite'
import { Download, FieldVisibility, TrackSegment } from 'models/Track'

type OpaqueID = string

export type APIUser = {
  album_count: number
  bio: Nullable<string>
  cover_photo: CoverPhotoSizes
  followee_count: number
  follower_count: number
  handle: string
  id: OpaqueID
  is_verified: boolean
  location: Nullable<string>
  name: string
  playlist_count: number
  profile_picture: ProfilePictureSizes
  repost_count: number
  track_count: number
  created_at: string
  creator_node_endpoint: Nullable<string>
  current_user_followee_follow_count: number
  does_current_user_follow: boolean
  handle_lc: string
  is_creator: boolean
  updated_at: string
  cover_photo_sizes: Nullable<CID>
  cover_photo_legacy: Nullable<CID>
  profile_picture_sizes: Nullable<CID>
  profile_picture_legacy: Nullable<CID>
}

export type APIRepost = {
  repost_item_id: string
  repost_type: string
  user_id: string
}

export type APIFavorite = {
  favorite_item_id: string
  favorite_type: FavoriteType
  user_id: string
}

export type APIRemix = {
  parent_track_id: OpaqueID
  user: APIUser
  has_remix_author_reposted: boolean
  has_remix_author_saved: boolean
}

export type APITrack = {
  artwork: CoverArtSizes
  description: Nullable<string>
  genre: string
  id: OpaqueID
  mood: Nullable<string>
  release_date: Nullable<string>
  remix_of: {
    tracks: null | APIRemix[]
  }
  repost_count: number
  favorite_count: number
  tags: Nullable<string>
  title: string
  user: APIUser
  duration: number
  downloadable: boolean
  create_date: Nullable<string>
  created_at: string
  credits_splits: Nullable<string>
  cover_art_sizes: string
  download: Download
  isrc: Nullable<string>
  license: Nullable<string>
  iswc: Nullable<string>
  field_visibility: FieldVisibility
  followee_reposts: APIRepost[]
  has_current_user_reposted: boolean
  is_unlisted: boolean
  has_current_user_saved: boolean
  followee_favorites: APIFavorite[]
  route_id: string
  stem_of: any
  track_segments: TrackSegment[]
  updated_at: string
  user_id: OpaqueID
  is_delete: boolean
  cover_art: Nullable<string>
  play_count: number
}

export type APIResponse<T> = {
  data: T
}
