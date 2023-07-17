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

export const getDogEarType = ({
  doesUserHaveAccess,
  isArtistPick,
  isOwner,
  isUnlisted,
  premiumConditions
}: GetDogEarTypeArgs) => {
  // Unlisted is mutually exclusive from other dog ear types
  if (isUnlisted) {
    return DogEarType.HIDDEN
  }

  // Show premium variants for track owners or if user does not yet have access
  if ((isOwner || !doesUserHaveAccess) && premiumConditions != null) {
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

  return undefined
}
