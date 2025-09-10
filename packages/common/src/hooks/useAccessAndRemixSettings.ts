import { useSelector } from 'react-redux'

import { useArtistCoins, useCurrentUserId } from '~/api/'
import { getSupportedUserCollections } from '~/store/collectibles/selectors'
import { CommonState } from '~/store/reducers'

type UseAccessAndRemixSettingsProps = {
  isUpload: boolean
  isRemix: boolean
  isAlbum?: boolean
  isInitiallyUnlisted: boolean
  isScheduledRelease?: boolean
  isPublishDisabled?: boolean
}

export const useHasNoCollectibles = () => {
  const { data: userId } = useCurrentUserId()
  const { isLoading, ethCollectionMap, solCollectionMap } = useSelector(
    (state: CommonState) => getSupportedUserCollections(state, { userId })
  )
  const numEthCollectibles = Object.keys(ethCollectionMap).length
  const numSolCollectibles = Object.keys(solCollectionMap).length
  return !isLoading && numEthCollectibles + numSolCollectibles === 0
}

export const useHasNoTokens = () => {
  const { data: userId } = useCurrentUserId()
  const { data: coins, isLoading } = useArtistCoins({
    owner_id: userId ? [userId] : undefined
  })

  return !isLoading && coins?.length === 0
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
  const hasNoTokens = useHasNoTokens()

  return {
    disableUsdcGate: isRemix || shouldDisablePublish,
    disableSpecialAccessGate: isAlbum || isRemix || shouldDisablePublish,
    disableSpecialAccessGateFields: isAlbum || isRemix || shouldDisablePublish,
    disableCollectibleGate:
      isAlbum || isRemix || hasNoCollectibles || shouldDisablePublish,
    disableCollectibleGateFields:
      isAlbum || isRemix || hasNoCollectibles || shouldDisablePublish,
    disableTokenGate: isAlbum || isRemix || hasNoTokens || shouldDisablePublish,
    disableTokenGateFields:
      isAlbum || isRemix || hasNoTokens || shouldDisablePublish,
    disableHidden: isAlbum || isScheduledRelease
  }
}
