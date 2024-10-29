import type { full } from '@audius/sdk'
import { omit } from 'lodash'
import snakecaseKeys from 'snakecase-keys'

import {
  AccountUserMetadata,
  ManagedUserMetadata,
  UserManagerMetadata,
  UserMetadata
} from '~/models/User'
import { SolanaWalletAddress, StringWei } from '~/models/Wallet'
import { decodeHashId } from '~/utils/hashIds'
import { removeNullable } from '~/utils/typeUtils'

import { accountCollectionFromSDK } from './collection'
import { grantFromSDK } from './grant'
import {
  coverPhotoSizesCIDsFromSDK,
  profilePictureSizesCIDsFromSDK
} from './imageSize'
import { playlistLibraryFromSDK } from './playlistLibrary'
import { transformAndCleanList } from './utils'

/** Converts a SDK `full.UserFull` response to a UserMetadata. Note: Will _not_ include the "current user" fields as those aren't returned by the Users API */
export const userMetadataFromSDK = (
  input: full.UserFull
): UserMetadata | undefined => {
  const decodedUserId = decodeHashId(input.id)
  if (!decodedUserId) {
    return undefined
  }

  const newUser: UserMetadata = {
    // Fields from API that are omitted in this model
    ...omit(snakecaseKeys(input), [
      'id',
      'cover_photo_legacy',
      'profile_picture_legacy'
    ]),

    // Conversions
    artist_pick_track_id: input.artistPickTrackId
      ? decodeHashId(input.artistPickTrackId)
      : null,

    // Nested Types
    playlist_library: playlistLibraryFromSDK(input.playlistLibrary) ?? null,
    cover_photo_cids: input.coverPhotoCids
      ? coverPhotoSizesCIDsFromSDK(input.coverPhotoCids)
      : null,
    profile_picture_cids: input.profilePictureCids
      ? profilePictureSizesCIDsFromSDK(input.profilePictureCids)
      : null,

    // Re-types
    balance: input.balance as StringWei,
    associated_wallets_balance: input.associatedWalletsBalance as StringWei,
    total_balance: input.totalBalance as StringWei,
    user_id: decodedUserId,
    spl_wallet: input.splWallet as SolanaWalletAddress,
    spl_usdc_payout_wallet: input.splUsdcPayoutWallet as SolanaWalletAddress,

    // Legacy Overrides
    cover_photo: input.coverPhotoLegacy ?? null,
    profile_picture: input.profilePictureLegacy ?? null,

    // Required Nullable fields
    bio: input.bio ?? null,
    twitter_handle: input.twitterHandle ?? null,
    instagram_handle: input.instagramHandle ?? null,
    tiktok_handle: input.tiktokHandle ?? null,
    website: input.website ?? null,
    donation: input.donation ?? null,
    cover_photo_sizes: input.coverPhotoSizes ?? null,
    creator_node_endpoint: input.creatorNodeEndpoint ?? null,
    location: input.location ?? null,
    metadata_multihash: input.metadataMultihash ?? null,
    profile_picture_sizes: input.profilePictureSizes ?? null
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

export const accountFromSDK = (
  input: full.AccountFull
): AccountUserMetadata | undefined => {
  const user = userMetadataFromSDK(input.user)
  if (!user) {
    return undefined
  }
  const accountMetadata = {
    playlists: transformAndCleanList(input.playlists, accountCollectionFromSDK),
    playlist_library: playlistLibraryFromSDK(input.playlistLibrary) ?? null,
    track_save_count: input.trackSaveCount
  }
  return {
    // Account users included extended information, so we'll merge that in here.
    user: {
      ...user,
      ...accountMetadata
    },
    // These values are included outside the user as well to facilitate separate caching
    ...accountMetadata
  }
}
