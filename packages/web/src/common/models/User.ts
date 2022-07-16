import { CID, ID } from '@audius/common'

import { Collectible, CollectiblesMetadata } from 'common/models/Collectible'
import Color from 'common/models/Color'
import { CoverPhotoSizes, ProfilePictureSizes } from 'common/models/ImageSizes'
import { PlaylistLibrary } from 'common/models/PlaylistLibrary'
import {
  SolanaWalletAddress,
  StringWei,
  WalletAddress
} from 'common/models/Wallet'
import { Nullable } from 'common/utils/typeUtils'

import Timestamped from './Timestamped'

export type UserMetadata = {
  album_count: number
  bio: string | null
  cover_photo: Nullable<CID>
  creator_node_endpoint: Nullable<string>
  current_user_followee_follow_count: number
  does_current_user_follow: boolean
  followee_count: number
  follower_count: number
  supporter_count: number
  supporting_count: number
  handle: string
  handle_lc: string
  is_deactivated: boolean
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
  erc_wallet: WalletAddress
  spl_wallet: SolanaWalletAddress
  has_collectibles: boolean
  collectibles?: CollectiblesMetadata
  collectiblesOrderUnset?: boolean
  collectibleList?: Collectible[]
  solanaCollectibleList?: Collectible[]

  // Only present on the "current" account
  does_follow_current_user?: boolean
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
  total_balance?: Nullable<StringWei>
  associated_wallets_balance?: Nullable<StringWei>
  playlist_library?: PlaylistLibrary
  userBank?: SolanaWalletAddress
} & Timestamped

export type ComputedUserProperties = {
  _profile_picture_sizes: ProfilePictureSizes
  _cover_photo_sizes: CoverPhotoSizes
  _collectionIds?: string[]
  _profile_picture_color?: Color
  _artist_pick?: ID
  _has_reposted?: boolean
  updatedProfilePicture?: { file: File; url: string }
  updatedCoverPhoto?: { file: File; url: string }
}

export type User = UserMetadata & ComputedUserProperties
