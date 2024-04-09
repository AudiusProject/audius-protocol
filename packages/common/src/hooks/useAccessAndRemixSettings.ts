import { useSelector } from 'react-redux'

import {
  AccessConditions,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from '~/models/Track'
import { getSupportedUserCollections } from '~/store/collectibles/selectors'
import { Nullable } from '~/utils/typeUtils'

type UseAccessAndRemixSettingsProps = {
  isUpload: boolean
  isRemix: boolean
  isAlbum?: boolean
  initialStreamConditions: Nullable<AccessConditions>
  isInitiallyUnlisted: boolean
  isScheduledRelease?: boolean
}

export const useHasNoCollectibles = () => {
  const { isLoading, ethCollectionMap, solCollectionMap } = useSelector(
    getSupportedUserCollections
  )
  const numEthCollectibles = Object.keys(ethCollectionMap).length
  const numSolCollectibles = Object.keys(solCollectionMap).length
  return !isLoading && numEthCollectibles + numSolCollectibles === 0
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
  isAlbum,
  initialStreamConditions,
  isInitiallyUnlisted,
  isScheduledRelease = false
}: UseAccessAndRemixSettingsProps) => {
  const isInitiallyPublic =
    !isInitiallyUnlisted && !isUpload && !initialStreamConditions

  const isInitiallyUsdcGated =
    !isInitiallyUnlisted && // track must be published
    !isUpload &&
    isContentUSDCPurchaseGated(initialStreamConditions)

  const isInitiallySpecialAccess =
    !isInitiallyUnlisted &&
    !isUpload &&
    !!(
      isContentFollowGated(initialStreamConditions) ||
      isContentTipGated(initialStreamConditions)
    )

  const isInitiallyCollectibleGated =
    !isInitiallyUnlisted &&
    !isUpload &&
    isContentCollectibleGated(initialStreamConditions)

  const isInitiallyHidden = !isUpload && isInitiallyUnlisted

  const noUsdcGate =
    isRemix ||
    isInitiallyPublic ||
    isInitiallySpecialAccess ||
    isInitiallyCollectibleGated

  const noSpecialAccessGate =
    isAlbum ||
    isRemix ||
    isInitiallyPublic ||
    isInitiallyUsdcGated ||
    isInitiallyCollectibleGated
  const noSpecialAccessGateFields =
    noSpecialAccessGate || (!isUpload && !isInitiallyHidden)

  const hasNoCollectibles = useHasNoCollectibles()
  const noCollectibleGate =
    isAlbum ||
    isRemix ||
    isInitiallyPublic ||
    isInitiallyUsdcGated ||
    isInitiallySpecialAccess ||
    hasNoCollectibles
  const noCollectibleGateFields =
    noCollectibleGate || (!isUpload && !isInitiallyHidden)

  const noHidden =
    isAlbum || isScheduledRelease || (!isUpload && !isInitiallyUnlisted)

  return {
    noUsdcGate,
    noSpecialAccessGate,
    noSpecialAccessGateFields,
    noCollectibleGate,
    noCollectibleGateFields,
    noHidden
  }
}
