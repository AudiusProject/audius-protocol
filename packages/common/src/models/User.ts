import { Collectible, CollectiblesMetadata } from '~/models/Collectible'
import { Color } from '~/models/Color'
import { CID, ID } from '~/models/Identifiers'
import {
  CoverPhotoSizes,
  CoverPhotoSizesCids,
  ProfilePictureSizes,
  ProfilePictureSizesCids
} from '~/models/ImageSizes'
import { PlaylistLibrary } from '~/models/PlaylistLibrary'
import { SolanaWalletAddress, StringWei, WalletAddress } from '~/models/Wallet'
import { Nullable } from '~/utils/typeUtils'

import { AccountCollection } from './Collection'
import { Grant } from './Grant'
import { Timestamped } from './Timestamped'
import { UserEvent } from './UserEvent'

export type SocialPlatform = 'twitter' | 'instagram' | 'tiktok'

export type UserMetadata = {
  album_count: number
  allow_ai_attribution?: boolean
  artist_pick_track_id: Nullable<number>
  associated_wallets_balance?: Nullable<StringWei>
  balance?: Nullable<StringWei>
  bio: Nullable<string>
  blocknumber: number
  collectibleList?: Collectible[]
  collectibles?: CollectiblesMetadata
  collectiblesOrderUnset?: boolean
  cover_photo_cids?: Nullable<CoverPhotoSizesCids>
  cover_photo_sizes: Nullable<CID>
  cover_photo: CoverPhotoSizes & { mirrors?: string[] | undefined }
  creator_node_endpoint: Nullable<string>
  current_user_followee_follow_count: number
  does_current_user_follow: boolean
  does_current_user_subscribe?: boolean
  does_follow_current_user: boolean
  erc_wallet: WalletAddress
  followee_count: number
  follower_count: number
  handle_lc: string
  handle: string
  has_collectibles: boolean
  is_deactivated: boolean
  is_verified: boolean
  twitter_handle: Nullable<string>
  instagram_handle: Nullable<string>
  tiktok_handle: Nullable<string>
  verified_with_twitter: boolean
  verified_with_instagram: boolean
  verified_with_tiktok: boolean
  website: Nullable<string>
  donation: Nullable<string>
  location: Nullable<string>
  metadata_multihash: Nullable<CID>
  name: string
  playlist_count: number
  profile_picture_cids?: Nullable<ProfilePictureSizesCids>
  profile_picture_sizes: Nullable<CID>
  profile_picture: ProfilePictureSizes & { mirrors?: string[] | undefined }
  repost_count: number
  solanaCollectibleList?: Collectible[]
  spl_wallet: Nullable<SolanaWalletAddress>
  spl_usdc_payout_wallet?: Nullable<SolanaWalletAddress>
  supporter_count: number
  supporting_count: number
  total_balance?: Nullable<StringWei>
  track_count: number
  user_id: number
  wallet?: string

  // Used by redux cache
  local?: boolean

  // Only present on the "current" account
  events?: UserEvent
} & Timestamped

export type WriteableUserMetadata = UserMetadata & {
  associated_sol_wallets?: Nullable<Record<string, { signature: string }>>
  associated_wallets?: Nullable<Record<string, { signature: string }>>
}

export type AccountUserMetadata = {
  user: UserMetadata & { playlists: AccountCollection[] }
  playlists: AccountCollection[]
  track_save_count: number
  playlist_library?: Nullable<PlaylistLibrary>
}

export type ManagedUserMetadata = {
  grant: Grant
  user: UserMetadata
}

export type UserManagerMetadata = {
  grant: Grant
  manager: UserMetadata
}

export type ComputedUserProperties = {
  _collectionIds?: ID[]
  _profile_picture_color?: Color
  updatedProfilePicture?: { file: File; url: string }
  updatedCoverPhoto?: { file: File; url: string }
}

export type User = UserMetadata & ComputedUserProperties

export type CachedAccount = {
  userId: ID
  collections: AccountCollection[]
  playlistLibrary?: Nullable<PlaylistLibrary>
  trackSaveCount: number
  guestEmail: string | null
}

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

export type TwitterUser = {
  verified: boolean
}

export type InstagramUser = {
  is_verified: boolean
}

export type TikTokUser = {
  verified: boolean
}
