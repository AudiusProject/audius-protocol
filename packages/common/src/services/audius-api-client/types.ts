import type { full } from '@audius/sdk'

import {
  CID,
  FavoriteType,
  CoverArtSizes,
  CoverPhotoSizes,
  ProfilePictureSizes,
  StemCategory,
  FieldVisibility,
  TrackSegment,
  SolanaWalletAddress,
  WalletAddress,
  Supporter,
  Supporting,
  UserTip,
  AccessConditions,
  ID,
  AccessPermissions,
  NFTAccessSignature
} from '../../models'
import { License, Nullable } from '../../utils'

export type OpaqueID = string

export type APIUser = {
  album_count: number
  artist_pick_track_id: Nullable<OpaqueID>
  blocknumber: number
  balance: string
  associated_wallets_balance: string
  bio: Nullable<string>
  cover_photo: CoverPhotoSizes
  followee_count: number
  follower_count: number
  handle: string
  id: OpaqueID
  is_verified: boolean
  is_deactivated: boolean
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
  does_current_user_subscribe?: boolean
  handle_lc: string
  updated_at: string
  cover_photo_sizes: Nullable<CID>
  cover_photo_cids: Nullable<CoverPhotoSizes>
  cover_photo_legacy: Nullable<CID>
  profile_picture_sizes: Nullable<CID>
  profile_picture_cids: Nullable<ProfilePictureSizes>
  profile_picture_legacy: Nullable<CID>
  metadata_multihash: Nullable<CID>
  erc_wallet: WalletAddress
  spl_wallet: SolanaWalletAddress
  has_collectibles: boolean
  supporter_count: number
  supporting_count: number
}

export type APISearchUser = Omit<
  APIUser,
  | 'album_count'
  | 'followee_count'
  | 'follower_count'
  | 'playlist_count'
  | 'repost_count'
  | 'track_count'
  | 'current_user_followee_follow_count'
  | 'does_current_user_follow'
  | 'does_current_user_subscribe'
>

export type APIRepost = {
  repost_item_id: string
  repost_type: string
  user_id: string
}

export type APIFavorite = {
  favorite_item_id: string
  favorite_type: FavoriteType
  user_id: string
  created_at: string
}

export type APIRemix = {
  parent_track_id: OpaqueID
  user: APIUser
  has_remix_author_reposted: boolean
  has_remix_author_saved: boolean
}

export type APITrack = {
  blocknumber: number
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
  create_date: Nullable<string>
  created_at: string
  credits_splits: Nullable<string>
  cover_art_sizes: string
  cover_art_cids: Nullable<CoverArtSizes>
  isrc: Nullable<string>
  license: Nullable<License>
  iswc: Nullable<string>
  field_visibility: FieldVisibility
  followee_reposts: APIRepost[]
  has_current_user_reposted: boolean
  is_scheduled_release: boolean
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
  permalink: string
  is_available: boolean
  is_stream_gated: boolean
  stream_conditions: Nullable<AccessConditions>
  is_download_gated: boolean
  download_conditions: Nullable<AccessConditions>
  access: AccessPermissions
  preview_cid: Nullable<CID>
  track_cid: Nullable<CID>
  orig_file_cid: Nullable<CID>
  orig_filename: Nullable<string>
  is_downloadable: boolean
  is_original_available: boolean
  ddex_app: Nullable<string>
}

export type APISearchTrack = Omit<
  APITrack,
  | 'repost_count'
  | 'favorite_count'
  | 'has_current_user_reposted'
  | 'has_current_user_saved'
  | 'followee_reposts'
  | 'followee_favorites'
  | 'play_count'
>

export type APIStem = {
  id: OpaqueID
  parent_id: OpaqueID
  user_id: OpaqueID
  category: StemCategory
  cid: CID
  blocknumber: number
  orig_filename: string
}

export type APIPlaylistAddedTimestamp = {
  metadata_timestamp: number
  timestamp: number
  track_id: OpaqueID
}

export type APIPlaylist = {
  blocknumber: number
  artwork: CoverArtSizes
  description: Nullable<string>
  id: OpaqueID
  is_album: boolean
  playlist_name: string
  repost_count: number
  favorite_count: number
  total_play_count: number
  user_id: OpaqueID
  user: APIUser
  created_at: string
  updated_at: string
  followee_reposts: APIRepost[]
  followee_favorites: APIFavorite[]
  has_current_user_reposted: boolean
  has_current_user_saved: boolean
  is_delete: boolean
  is_private: boolean
  added_timestamps: APIPlaylistAddedTimestamp[]
  tracks: APITrack[]
  track_count: number
  cover_art: Nullable<string>
  cover_art_sizes: Nullable<string>
  cover_art_cids: Nullable<CoverArtSizes>
}

export type APISearchPlaylist = Omit<
  APIPlaylist,
  | 'repost_count'
  | 'favorite_count'
  | 'total_play_count'
  | 'followee_reposts'
  | 'followee_favorites'
  | 'has_current_user_reposted'
  | 'has_current_user_saved'
  | 'tracks'
>

export type APIItemType = 'track' | 'playlist'

export type APIActivity = { timestamp: string } & (
  | { item_type: 'track'; item: APITrack }
  | { item_type: 'playlist'; item: APIPlaylist }
)

export type APIActivityV2 = full.TrackActivityFull | full.CollectionActivityFull

export const isApiActivityV2 = (
  activity: APIActivity | APIActivityV2
): activity is APIActivityV2 => {
  return (activity as APIActivityV2).itemType !== undefined
}

export const isApiActivityV1 = (
  activity: APIActivity | APIActivityV2
): activity is APIActivity => {
  return (activity as APIActivity).item_type !== undefined
}

export type APISearch = {
  users?: APIUser[]
  followed_users?: APIUser[]
  tracks?: APITrack[]
  saved_tracks?: APITrack[]
  playlists?: APIPlaylist[]
  saved_playlists?: APIPlaylist[]
  albums?: APIPlaylist[]
  saved_albums?: APIPlaylist[]
}

export type APISearchAutocomplete = {
  users?: APISearchUser[]
  followed_users?: APISearchUser[]
  tracks?: APISearchTrack[]
  saved_tracks?: APISearchTrack[]
  playlists?: APISearchPlaylist[]
  saved_playlists?: APISearchPlaylist[]
  albums?: APISearchPlaylist[]
  saved_albums?: APISearchPlaylist[]
}

export type APIBlockConfirmation = {
  block_found: boolean
  block_passed: boolean
}

export type APIResponse<T> = {
  data: T
}

export type SupportingResponse = Omit<Supporting, 'receiver_id'> & {
  receiver: APIUser
}
export type SupporterResponse = Omit<Supporter, 'sender_id'> & {
  sender: APIUser
}

type UserTipOmitIds = 'sender_id' | 'receiver_id' | 'followee_supporter_ids'
export type GetTipsResponse = Omit<UserTip, UserTipOmitIds> & {
  sender: APIUser
  receiver: APIUser
  followee_supporters: { user_id: string }[]
}

export type GetNFTGatedTrackSignaturesResponse = {
  [id: ID]: NFTAccessSignature
}
