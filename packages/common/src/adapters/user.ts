import type { full } from '@audius/sdk'
import { omit } from 'lodash'
import snakecaseKeys from 'snakecase-keys'

import {
  ManagedUserMetadata,
  UserManagerMetadata,
  UserMetadata
} from '~/models/User'
import { SolanaWalletAddress, StringWei } from '~/models/Wallet'
import { decodeHashId } from '~/utils/hashIds'
import { removeNullable } from '~/utils/typeUtils'

import { grantFromSDK } from './grant'
import {
  coverPhotoSizesCIDsFromSDK,
  profilePictureSizesCIDsFromSDK
} from './imageSize'
import { playlistLibraryFromSDK } from './playlistLibrary'

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
    playlist_library: playlistLibraryFromSDK(user.playlist_library) ?? null,
    cover_photo_cids: user.cover_photo_cids
      ? coverPhotoSizesCIDsFromSDK(user.cover_photo_cids)
      : null,
    profile_picture_cids: user.profile_picture_cids
      ? profilePictureSizesCIDsFromSDK(user.profile_picture_cids)
      : null,

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
    twitter_handle: user.twitter_handle ?? null,
    instagram_handle: user.instagram_handle ?? null,
    tiktok_handle: user.tiktok_handle ?? null,
    website: user.website ?? null,
    donation: user.donation ?? null,
    cover_photo_sizes: user.cover_photo_sizes ?? null,
    creator_node_endpoint: user.creator_node_endpoint ?? null,
    location: user.location ?? null,
    metadata_multihash: user.metadata_multihash ?? null,
    profile_picture_sizes: user.profile_picture_sizes ?? null
  }

  return newUser
}

export const userMetadataListFromSDK = (input?: full.UserFull[]) =>
  input ? input.map((d) => userMetadataFromSDK(d)).filter(removeNullable) : []

export const managedUserFromSDK = (
  input: full.ManagedUser
): ManagedUserMetadata | undefined => {
  const user = userMetadataFromSDK(input.user)
  if (!user) {
    return undefined
  }
  return {
    user,
    grant: grantFromSDK(input.grant)
  }
}

export const managedUserListFromSDK = (input?: full.ManagedUser[]) =>
  input ? input.map((d) => managedUserFromSDK(d)).filter(removeNullable) : []

export const userManagerFromSDK = (
  input: full.UserManager
): UserManagerMetadata | undefined => {
  const manager = userMetadataFromSDK(input.manager)
  if (!manager) {
    return undefined
  }
  return {
    manager,
    grant: grantFromSDK(input.grant)
  }
}

export const userManagerListFromSDK = (input?: full.UserManager[]) =>
  input ? input.map((d) => userManagerFromSDK(d)).filter(removeNullable) : []
