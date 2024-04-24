import { useSelector } from 'react-redux'

import { getSupportedUserCollections } from '~/store/collectibles/selectors'

type UseAccessAndRemixSettingsProps = {
  isUpload: boolean
  isRemix: boolean
  isAlbum?: boolean
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
  isUpload,
  isRemix,
  isAlbum = false,
  isScheduledRelease = false
}: UseAccessAndRemixSettingsProps) => {
  const disableUsdcGate = isRemix

  const disableSpecialAccessGate = isAlbum || isRemix

  // This applies when the parent field is active but we still want to disable sub-options
  // used for edit flow to not allow increasing permission strictness
  const disableSpecialAccessGateFields = disableSpecialAccessGate || !isUpload

  const hasNoCollectibles = useHasNoCollectibles()

  const disableCollectibleGate = isAlbum || isRemix || hasNoCollectibles

  // This applies when the parent field is active but we still want to disable sub-options
  // used for edit flow to not allow increasing permission strictness
  const disableCollectibleGateFields = disableCollectibleGate || !isUpload

  const disableHidden = isScheduledRelease || !isUpload

  return {
    disableUsdcGate,
    disableSpecialAccessGate,
    disableSpecialAccessGateFields,
    disableCollectibleGate,
    disableCollectibleGateFields,
    disableHidden
  }
}
