import { isEmpty } from 'lodash'

import { DogEarType } from '~/models/DogEar'
import { AccessConditions } from '~/models/Track'

import { Nullable } from './typeUtils'

type GetDogEarTypeArgs = {
  hasStreamAccess?: boolean
  isArtistPick?: boolean
  isOwner?: boolean
  isUnlisted?: boolean
  streamConditions?: Nullable<AccessConditions>
  downloadConditions?: Nullable<AccessConditions>
}

/** Determines appropriate DogEar type based on conditions provided. Note: all conditions
 * are optional. Omitting a condition is effectively ignoring it. This can be used, for example
 * to always show gated variants if present by omitting `hasStreamAccess`.
 * Behavior:
 * * isArtistPick: if true and hasStreamAccess is true, prefers artist pick variant
 * * hasStreamAccess: if true, will never return gated variants
 * * isOwner: if true, will always return gated variants if present
 * * isUnlisted: if true, will always return hidden variant
 */
export const getDogEarType = ({
  hasStreamAccess,
  isArtistPick,
  isOwner,
  isUnlisted,
  streamConditions,
  downloadConditions
}: GetDogEarTypeArgs) => {
  // Show gated variants for track owners or if user does not yet have access
  if (
    (isOwner || !hasStreamAccess) &&
    streamConditions != null &&
    !isEmpty(streamConditions)
  ) {
    if ('usdc_purchase' in streamConditions) {
      return DogEarType.USDC_PURCHASE
    } else if ('nft_collection' in streamConditions) {
      return DogEarType.COLLECTIBLE_GATED
    } else if (
      'follow_user_id' in streamConditions ||
      'tip_user_id' in streamConditions
    ) {
      return DogEarType.SPECIAL_ACCESS
    }
  }

  if (downloadConditions != null && !isEmpty(downloadConditions)) {
    if ('usdc_purchase' in downloadConditions) {
      return DogEarType.USDC_PURCHASE
    }
  }

  // If no gated variant, optionally show artist pick if applicable
  if (isArtistPick) {
    return DogEarType.STAR
  }

  if (isUnlisted) {
    return DogEarType.HIDDEN
  }

  return undefined
}
