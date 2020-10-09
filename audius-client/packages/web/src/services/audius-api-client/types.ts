import { Nullable } from 'utils/typeUtils'

import { CID } from 'models/common/Identifiers'
import {
  CoverArtSizes,
  CoverPhotoSizes,
  ProfilePictureSizes
} from 'models/common/ImageSizes'
import { FavoriteType } from 'models/Favorite'
import { Download, FieldVisibility, TrackSegment } from 'models/Track'
import { StemCategory } from 'models/Stems'

export type OpaqueID = string
type PlaylistContents = {
  track_ids: Array<{ time: number; track: number }>
}

export type APIUser = {
  album_count: Nullable<number>
  bio: Nullable<string>
  cover_photo: CoverPhotoSizes
  followee_count: Nullable<number>
  follower_count: Nullable<number>
  handle: string
  id: OpaqueID
  is_verified: boolean
  location: Nullable<string>
  name: string
  playlist_count: Nullable<number>
  profile_picture: ProfilePictureSizes
  repost_count: Nullable<number>
  track_count: Nullable<number>
  created_at: string
  creator_node_endpoint: Nullable<string>
  current_user_followee_follow_count: Nullable<number>
  does_current_user_follow: Nullable<boolean>
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
  repost_count: Nullable<number>
  favorite_count: Nullable<number>
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
  has_current_user_reposted: Nullable<boolean>
  is_unlisted: boolean
  has_current_user_saved: Nullable<boolean>
  followee_favorites: Nullable<APIFavorite[]>
  route_id: string
  stem_of: any
  track_segments: TrackSegment[]
  updated_at: string
  user_id: OpaqueID
  is_delete: boolean
  cover_art: Nullable<string>
  play_count: Nullable<number>
}

export type APIStem = {
  id: OpaqueID
  parent_id: OpaqueID
  user_id: OpaqueID
  category: StemCategory
  cid: CID
}

export type APIPlaylistAddedTimestamp = {
  timestamp: number
  track_id: OpaqueID
}

export type APIPlaylist = {
  artwork: CoverArtSizes
  description: Nullable<string>
  id: OpaqueID
  is_album: boolean
  playlist_name: string
  repost_count: Nullable<number>
  favorite_count: Nullable<number>
  total_play_count: Nullable<number>
  user_id: OpaqueID
  user: APIUser
  created_at: string
  updated_at: string
  followee_reposts: APIRepost[]
  followee_favorites: APIFavorite[]
  has_current_user_reposted: Nullable<boolean>
  has_current_user_saved: Nullable<boolean>
  is_delete: boolean
  is_private: boolean
  added_timestamps: APIPlaylistAddedTimestamp[]
  tracks: APITrack[]
  cover_art: Nullable<string>
  cover_art_sies: Nullable<string>
}

export type APIItemType = 'track' | 'playlist'

export type APIActivity = { timestamp: string } & (
  | { item_type: 'track'; item: APITrack }
  | { item_type: 'playlist'; item: APIPlaylist }
)

export type APISearch = {
  users?: APIUser[]
  followed_users?: APIUser[]
  tracks?: APITrack[]
  saved_tracks?: APITrack[]
  playlists?: any[]
  saved_playlists?: any[]
  albums?: any[]
  saved_albums?: any[]
}

export type APIResponse<T> = {
  data: T
}
