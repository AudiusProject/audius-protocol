import { Collectible, CollectiblesMetadata } from '~/models/Collectible'
import { Color } from '~/models/Color'
import { CID, ID } from '~/models/Identifiers'
import { CoverPhotoSizes, ProfilePictureSizes } from '~/models/ImageSizes'
import { PlaylistLibrary } from '~/models/PlaylistLibrary'
import { SolanaWalletAddress, StringWei, WalletAddress } from '~/models/Wallet'
import { Nullable } from '~/utils/typeUtils'

import { Timestamped } from './Timestamped'

export type UserMetadata = {
  album_count: number
  allow_ai_attribution?: boolean
  artist_pick_track_id: Nullable<number>
  bio: Nullable<string>
  blocknumber: number
  cover_photo: Nullable<CID>
  creator_node_endpoint: Nullable<string>
  current_user_followee_follow_count: number
  does_current_user_follow: boolean
  does_current_user_subscribe?: boolean
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
  cover_photo_cids?: Nullable<CoverPhotoSizes>
  profile_picture_sizes: Nullable<CID>
  profile_picture_cids?: Nullable<ProfilePictureSizes>
  metadata_multihash: Nullable<CID>
  erc_wallet: WalletAddress
  spl_wallet: Nullable<SolanaWalletAddress>
  has_collectibles: boolean
  collectibles?: CollectiblesMetadata
  collectiblesOrderUnset?: boolean
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
  tikTokVerified?: boolean
  balance?: Nullable<StringWei>
  total_balance?: Nullable<StringWei>
  associated_wallets?: Nullable<string[]>
  associated_sol_wallets?: Nullable<string[]>
  associated_wallets_balance?: Nullable<StringWei>
  playlist_library?: PlaylistLibrary
  userBank?: SolanaWalletAddress
  local?: boolean
} & Timestamped

export type ComputedUserProperties = {
  _profile_picture_sizes: ProfilePictureSizes
  _cover_photo_sizes: CoverPhotoSizes
  _collectionIds?: ID[]
  _profile_picture_color?: Color
  updatedProfilePicture?: { file: File; url: string }
  updatedCoverPhoto?: { file: File; url: string }
}

export type User = UserMetadata & ComputedUserProperties

export type UserImage = Pick<
  User,
  | 'cover_photo'
  | 'cover_photo_sizes'
  | 'cover_photo_cids'
  | 'profile_picture'
  | 'profile_picture_sizes'
  | 'profile_picture_cids'
>

export type UserMultihash = Pick<
  User,
  'metadata_multihash' | 'creator_node_endpoint'
>
