import { useSelector } from 'react-redux'

import { getSupportedUserCollections } from '~/store/collectibles/selectors'

type UseAccessAndRemixSettingsProps = {
  isUpload: boolean
  isRemix: boolean
  isAlbum?: boolean
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
 * 3. During edit, with editable access feature flag disabled,
 * rule of thumb is that gated tracks can only be modified to allow broader access.
 * This means that gated tracks can only be made public.
 * With editable access feature flag enabled, it follows the same rules as during upload.
 *
 * NOTE: this logic is different from the logic using feature flags. to determine whether options should render or not; just whether or not they should be disabled
 */
export const useAccessAndRemixSettings = ({
  isUpload,
  isRemix,
  isAlbum = false,
  isInitiallyUnlisted,
  isScheduledRelease = false,
  isPublishDisabled = false
}: UseAccessAndRemixSettingsProps) => {
  const isInitiallyHidden = !isUpload && isInitiallyUnlisted
  const shouldDisablePublish = isPublishDisabled && isInitiallyHidden

  const hasNoCollectibles = useHasNoCollectibles()

  return {
    disableUsdcGate: isRemix || shouldDisablePublish,
    disableSpecialAccessGate: isAlbum || isRemix || shouldDisablePublish,
    disableSpecialAccessGateFields: isAlbum || isRemix || shouldDisablePublish,
    disableCollectibleGate:
      isAlbum || isRemix || hasNoCollectibles || shouldDisablePublish,
    disableCollectibleGateFields:
      isAlbum || isRemix || hasNoCollectibles || shouldDisablePublish,
    disableHidden: isAlbum || isScheduledRelease
  }
}
