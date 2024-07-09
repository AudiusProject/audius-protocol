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
  isEditableAccessEnabled: boolean
  isUpload: boolean
  isRemix: boolean
  isAlbum?: boolean
  initialStreamConditions: Nullable<AccessConditions>
  isInitiallyUnlisted: boolean
  isScheduledRelease?: boolean
  isPublishDisabled?: boolean
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
 * Returns a map of booleans that determine whether certain access fields are enabled.
 * This is based on whether the user is uploading a track or editing it.
 *
 * 1. Remixes cannot be gated tracks.
 * 2. During upload, all access options are enabled unless the track is marked as a remix,
 * in which case only Public and Hidden are enabled.
 * 3. During edit, rule of thumb is that gated tracks can only be modified to allow broader access.
 *    This means that gated tracks can only be made public.
 * 4. Hidden tracks may be gated or made public.
 *
 * NOTE: this logic is different from the logic using feature flags. to determine whether options should render or not; just whether or not they should be disabled
 */
export const useAccessAndRemixSettings = ({
  isEditableAccessEnabled,
  isUpload,
  isRemix,
  isAlbum = false,
  initialStreamConditions,
  isInitiallyUnlisted,
  isScheduledRelease = false,
  isPublishDisabled = false
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
  const shouldDisablePublish = isPublishDisabled && isInitiallyHidden

  const disableUsdcGate =
    (!isInitiallyUsdcGated &&
      (isRemix ||
        isInitiallyPublic ||
        isInitiallySpecialAccess ||
        isInitiallyCollectibleGated)) ||
    shouldDisablePublish

  const disableSpecialAccessGate =
    isAlbum ||
    isRemix ||
    isInitiallyPublic ||
    isInitiallyUsdcGated ||
    isInitiallyCollectibleGated ||
    shouldDisablePublish

  // This applies when the parent field is active but we still want to disable sub-options
  // used for edit flow to not allow increasing permission strictness
  const disableSpecialAccessGateFields =
    disableSpecialAccessGate || (!isUpload && !isInitiallyHidden)

  const hasNoCollectibles = useHasNoCollectibles()

  const disableCollectibleGate =
    isAlbum ||
    isRemix ||
    isInitiallyPublic ||
    isInitiallyUsdcGated ||
    isInitiallySpecialAccess ||
    hasNoCollectibles ||
    shouldDisablePublish

  // This applies when the parent field is active but we still want to disable sub-options
  // used for edit flow to not allow increasing permission strictness
  const disableCollectibleGateFields =
    disableCollectibleGate || (!isUpload && !isInitiallyHidden)

  const disableHidden =
    isAlbum || isScheduledRelease || (!isUpload && !isInitiallyUnlisted)

  if (isEditableAccessEnabled) {
    return {
      disableUsdcGate: isRemix || shouldDisablePublish,
      disableSpecialAccessGate: isAlbum || isRemix || shouldDisablePublish,
      disableSpecialAccessGateFields: isAlbum || isRemix || shouldDisablePublish,
      disableCollectibleGate: isAlbum || isRemix || shouldDisablePublish,
      disableCollectibleGateFields: isAlbum || isRemix || shouldDisablePublish,
      disableHidden: isAlbum || isScheduledRelease
    }
  }

  return {
    disableUsdcGate,
    disableSpecialAccessGate,
    disableSpecialAccessGateFields,
    disableCollectibleGate,
    disableCollectibleGateFields,
    disableHidden
  }
}
