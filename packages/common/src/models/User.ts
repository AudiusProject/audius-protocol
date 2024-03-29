import { Collectible, CollectiblesMetadata } from '~/models/Collectible'
import { Color } from '~/models/Color'
import { CID, ID } from '~/models/Identifiers'
import {
  CoverPhotoSizes,
  CoverPhotoSizesCids,
  ProfilePictureSizes,
  ProfilePictureSizesCids,
  coverPhotoSizesCIDsFromSDK,
  profilePictureSizesCIDsFromSDK
} from '~/models/ImageSizes'
import {
  PlaylistLibrary,
  playlistLibraryFromSDK
} from '~/models/PlaylistLibrary'
import { SolanaWalletAddress, StringWei, WalletAddress } from '~/models/Wallet'
import { Nullable } from '~/utils/typeUtils'

import { Timestamped } from './Timestamped'
import { UserEvent } from './UserEvent'
import { full } from '@audius/sdk'
import snakecaseKeys from 'snakecase-keys'
import { decodeHashId } from '~/utils/hashIds'
import { omit } from 'lodash'

export type UserMetadata = {
  album_count: number
  allow_ai_attribution?: boolean
  artist_pick_track_id: Nullable<number>
  bio: Nullable<string>
  blocknumber: number
  collectibleList?: Collectible[]
  collectibles?: CollectiblesMetadata
  collectiblesOrderUnset?: boolean
  cover_photo_cids?: Nullable<CoverPhotoSizesCids>
  cover_photo_sizes: Nullable<CID>
  cover_photo: Nullable<CID>
  creator_node_endpoint: Nullable<string>
  current_user_followee_follow_count: number
  does_current_user_follow: boolean
  does_current_user_subscribe?: boolean
  erc_wallet: WalletAddress
  followee_count: number
  follower_count: number
  handle_lc: string
  handle: string
  has_collectibles: boolean
  is_deactivated: boolean
  is_verified: boolean
  location: Nullable<string>
  metadata_multihash: Nullable<CID>
  name: string
  playlist_count: number
  profile_picture_cids?: Nullable<ProfilePictureSizesCids>
  profile_picture_sizes: Nullable<CID>
  profile_picture: Nullable<CID>
  repost_count: number
  solanaCollectibleList?: Collectible[]
  spl_wallet: Nullable<SolanaWalletAddress>
  supporter_count: number
  supporting_count: number
  track_count: number

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
  events?: UserEvent
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

/** Converts a SDK `full.UserFull` response to a UserMetadata. Note: Will _not_ include the "current user" fields as those aren't returned by the Users API */
export const userMetadataFromSDK = (
  input: full.UserFull
): UserMetadata | undefined => {
  const user = snakecaseKeys(input)
  const decodedUserId = decodeHashId(user.id)
  if (!decodedUserId) {
    return undefined
  }

  const newUser: UserMetadata = {
    // Fields from API that are omitted in this model
    ...omit(user, ['id', 'cover_photo_legacy', 'profile_picture_legacy']),

    // Conversions
    artist_pick_track_id: user.artist_pick_track_id
      ? decodeHashId(user.artist_pick_track_id)
      : null,

    // Nested Types
    playlist_library: playlistLibraryFromSDK(user.playlist_library),
    cover_photo_cids: coverPhotoSizesCIDsFromSDK(user.cover_photo_cids) ?? null,
    profile_picture_cids:
      profilePictureSizesCIDsFromSDK(user.profile_picture_cids) ?? null,

    // Re-types
    balance: user.balance as StringWei,
    associated_wallets_balance: user.associated_wallets_balance as StringWei,
    total_balance: user.total_balance as StringWei,
    user_id: decodedUserId,
    spl_wallet: user.spl_wallet as SolanaWalletAddress,

    // Legacy Overrides
    cover_photo: user.cover_photo_legacy ?? null,
    profile_picture: user.profile_picture_legacy ?? null,

    // Required Nullable fields
    bio: user.bio ?? null,
    cover_photo_sizes: user.cover_photo_sizes ?? null,
    creator_node_endpoint: user.creator_node_endpoint ?? null,
    location: user.location ?? null,
    metadata_multihash: user.metadata_multihash ?? null,
    profile_picture_sizes: user.profile_picture_sizes ?? null
  }

  return newUser
}
