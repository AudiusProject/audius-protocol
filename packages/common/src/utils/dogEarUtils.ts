import { isEmpty } from 'lodash'

import { DogEarType } from 'models/DogEar'
import { StreamConditions } from 'models/Track'

import { Nullable } from './typeUtils'

type GetDogEarTypeArgs = {
  doesUserHaveAccess?: boolean
  isArtistPick?: boolean
  isOwner?: boolean
  isUnlisted?: boolean
  streamConditions?: Nullable<StreamConditions>
}

/** Determines appropriate DogEar type based on conditions provided. Note: all conditions
 * are optional. Omitting a condition is effectively ignoring it. This can be used, for example
 * to always show gated variants if present by omitting `doesUserHaveAccess`.
 * Behavior:
 * * isArtistPick: if true and doesUserHaveAccess is true, prefers artist pick variant
 * * doesUserHaveAccess: if true, will never return gated variants
 * * isOwner: if true, will always return gated variants if present
 * * isUnlisted: if true, will always return hidden variant
 */
export const getDogEarType = ({
  doesUserHaveAccess,
  isArtistPick,
  isOwner,
  isUnlisted,
  streamConditions
}: GetDogEarTypeArgs) => {
  // Show gated variants for track owners or if user does not yet have access
  if (
    (isOwner || !doesUserHaveAccess) &&
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

  // If no gated variant, optionally show artist pick if applicable
  if (isArtistPick) {
    return DogEarType.STAR
  }

  if (isUnlisted) {
    return DogEarType.HIDDEN
  }

  return undefined
}
