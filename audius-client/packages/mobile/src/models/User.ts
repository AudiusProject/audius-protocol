import Color from './common/Color'
import { CID, ID } from './common/Identifiers'
import { CoverPhotoSizes, ProfilePictureSizes } from './common/ImageSizes'
import { Nullable } from '../utils/typeUtils'
import Timestamped from './common/Timestamped'

export type UserImage = {
  cover_photo: Nullable<string>
  cover_photo_sizes: Nullable<string>
  cover_photo_legacy: Nullable<string>
  profile_picture: Nullable<string>
  profile_picture_sizes: Nullable<string>
  profile_picture_legacy: Nullable<string>
}

export type UserMultihash = {
  metadata_multihash: string
  creator_node_endpoint: string
}

export type UserHandle = {
  handle: string
}

export type UserName = {
  name: string
}

export type UserVerified = {
  is_verified: boolean
}

export type UserBalance = {
  associated_wallets_balance: string
  balance: string
}

export type UserMetadata = UserName &
  UserHandle &
  UserBalance &
  UserVerified & {
    album_count: number
    bio: string | null
    cover_photo: Nullable<CID>
    creator_node_endpoint: Nullable<string>
    current_user_followee_follow_count: number
    does_current_user_follow: boolean
    followee_count: number
    follower_count: number
    handle_lc: string
    is_creator: boolean
    location: Nullable<string>
    playlist_count: number
    profile_picture: Nullable<CID>
    repost_count: number
    track_count: number
    cover_photo_sizes: Nullable<CID>
    profile_picture_sizes: Nullable<CID>

    // Only present on the "current" account
    track_save_count?: number
    user_id: number
    twitter_handle?: string
    instagram_handle?: string
    website?: string
    donation?: string
    twitterVerified?: boolean
    instagramVerified?: boolean
  } & Timestamped

export type ComputedUserProperties = {
  _profile_picture_sizes: ProfilePictureSizes
  _cover_photo_sizes: CoverPhotoSizes
  _collectionIds?: string[]
  _profile_picture_color?: Color
  _artist_pick?: ID
}

type User = UserMetadata & ComputedUserProperties

export default User
