import {
  Collectible,
  CollectiblesMetadata
} from 'containers/collectibles/types'
import { PlaylistLibrary } from 'models/PlaylistLibrary'
import Color from 'models/common/Color'
import { CID, ID } from 'models/common/Identifiers'
import { CoverPhotoSizes, ProfilePictureSizes } from 'models/common/ImageSizes'
import { StringWei } from 'store/wallet/slice'
import { Nullable } from 'utils/typeUtils'

import Timestamped from './common/Timestamped'

export type UserMetadata = {
  album_count: number
  bio: string | null
  cover_photo: Nullable<CID>
  creator_node_endpoint: Nullable<string>
  current_user_followee_follow_count: number
  does_current_user_follow: boolean
  followee_count: number
  follower_count: number
  handle: string
  handle_lc: string
  is_creator: boolean
  is_verified: boolean
  location: Nullable<string>
  name: string
  playlist_count: number
  profile_picture: Nullable<CID>
  repost_count: number
  track_count: number
  cover_photo_sizes: Nullable<CID>
  profile_picture_sizes: Nullable<CID>
  metadata_multihash: Nullable<CID>
  has_collectibles: boolean
  collectibles?: CollectiblesMetadata
  collectibleList?: Collectible[]
  solanaCollectibleList?: Collectible[]

  // Only present on the "current" account
  track_save_count?: number
  user_id: number
  twitter_handle?: string
  instagram_handle?: string
  tiktok_handle?: string
  website?: string
  wallet?: string
  donation?: string
  twitterVerified?: boolean
  instagramVerified?: boolean
  balance?: Nullable<StringWei>
  associated_wallets_balance?: Nullable<StringWei>
  playlist_library?: PlaylistLibrary
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
