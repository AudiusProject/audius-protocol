import { useSelector } from 'react-redux'

import {
  PremiumConditions,
  isPremiumContentCollectibleGated,
  isPremiumContentFollowGated,
  isPremiumContentTipGated,
  isPremiumContentUSDCPurchaseGated
} from 'models/Track'
import { getSupportedUserCollections } from 'store/collectibles/selectors'
import { CommonState } from 'store/index'
import { Nullable } from 'utils/typeUtils'

type UseAccessAndRemixSettingsProps = {
  isUpload: boolean
  isRemix: boolean
  initialPremiumConditions: Nullable<PremiumConditions>
  isInitiallyUnlisted: boolean
  isScheduledRelease: boolean
}

/**
 * Returns a map of booleans that determine whether to show certain access fields are enabled.
 * This is based on whether the user is uploading a track or editing it.
 *
 * 1. Remixes cannot be gated tracks.
 * 2. During upload, all access options are enabled unless the track is marked as a remix,
 * in which case only Public and Hidden are enabled.
 * 3. During edit, rule of thumb is that gated tracks can only be modified to allow broader access.
 * This means that gated tracks can only be made public.
 * Hidden tracks may be gated or made public.
 */
export const useAccessAndRemixSettings = ({
  isUpload,
  isRemix,
  initialPremiumConditions,
  isInitiallyUnlisted,
  isScheduledRelease
}: UseAccessAndRemixSettingsProps) => {
  const hasNoCollectibles = useSelector((state: CommonState) => {
    const { ethCollectionMap, solCollectionMap } =
      getSupportedUserCollections(state)

    const numEthCollectibles = Object.keys(ethCollectionMap).length
    const numSolCollectibles = Object.keys(solCollectionMap).length
    return numEthCollectibles + numSolCollectibles === 0
  })
  const isReleased = (!isInitiallyUnlisted && isScheduledRelease)
  const isInitiallyPublic =
    !isUpload && (isReleased) && !initialPremiumConditions
  console.log('asdf isInitiallyPublic: ', isInitiallyPublic, isReleased)
  const isInitiallyUsdcGated =
    isReleased && !isUpload && isPremiumContentUSDCPurchaseGated(initialPremiumConditions)

  const isInitiallySpecialAccess =
    isReleased &&
    !isUpload &&
    !!(
      isPremiumContentFollowGated(initialPremiumConditions) ||
      isPremiumContentTipGated(initialPremiumConditions)
    )

  const isInitiallyCollectibleGated =
    isReleased && !isUpload && isPremiumContentCollectibleGated(initialPremiumConditions)

  const isInitiallyHidden = !isUpload && isInitiallyUnlisted

  const noUsdcGate =
    isRemix ||
    isInitiallyPublic ||
    isInitiallySpecialAccess ||
    isInitiallyCollectibleGated

  const noSpecialAccessGate =
    isRemix ||
    isInitiallyPublic ||
    isInitiallyUsdcGated ||
    isInitiallyCollectibleGated
  const noSpecialAccessGateFields =
    noSpecialAccessGate || (!isUpload && !isInitiallyHidden)

  const noCollectibleGate =
    isRemix ||
    isInitiallyPublic ||
    isInitiallyUsdcGated ||
    isInitiallySpecialAccess ||
    hasNoCollectibles
  const noCollectibleGateFields =
    noCollectibleGate || (!isUpload && !isInitiallyHidden)

  const noHidden = isScheduledRelease || (!isUpload && !isInitiallyUnlisted)
  return {
    noUsdcGate,
    noSpecialAccessGate,
    noSpecialAccessGateFields,
    noCollectibleGate,
    noCollectibleGateFields,
    noHidden
  }
}
