import { isEmpty } from 'lodash'

import { DogEarType } from 'models/DogEar'
import { PremiumConditions } from 'models/Track'

import { Nullable } from './typeUtils'

type GetDogEarTypeArgs = {
  doesUserHaveAccess?: boolean
  isArtistPick?: boolean
  isOwner?: boolean
  isUnlisted?: boolean
  premiumConditions?: Nullable<PremiumConditions>
}

/** Determines appropriate DogEar type based on conditions provided. Note: all conditions
 * are optional. Omitting a condition is effectively ignoring it. This can be used, for example
 * to always show premium variants if present by omitting `doesUserHaveAccess`.
 * Behavior:
 * * isArtistPick: if true and doesUserHaveAccess is true, prefers artist pick variant
 * * doesUserHaveAccess: if true, will never return premium variants
 * * isOwner: if true, will always return premium variants if present
 * * isUnlisted: if true, will always return hidden variant
 */
export const getDogEarType = ({
  doesUserHaveAccess,
  isArtistPick,
  isOwner,
  isUnlisted,
  premiumConditions
}: GetDogEarTypeArgs) => {
  // Show premium variants for track owners or if user does not yet have access
  if (
    (isOwner || !doesUserHaveAccess) &&
    premiumConditions != null &&
    !isEmpty(premiumConditions)
  ) {
    if ('usdc_purchase' in premiumConditions) {
      return DogEarType.USDC_PURCHASE
    } else if ('nft_collection' in premiumConditions) {
      return DogEarType.COLLECTIBLE_GATED
    } else if (
      'follow_user_id' in premiumConditions ||
      'tip_user_id' in premiumConditions
    ) {
      return DogEarType.SPECIAL_ACCESS
    }
  }

  // If no premium variant, optionally show artist pick if applicable
  if (isArtistPick) {
    return DogEarType.STAR
  }

  if (isUnlisted) {
    return DogEarType.HIDDEN
  }

  return undefined
}
