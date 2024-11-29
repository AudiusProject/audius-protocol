import { useSelector } from 'react-redux'

import { DogEarType } from '~/models'
import { ID } from '~/models/Identifiers'
import {
  isContentCollectibleGated,
  isContentSpecialAccess,
  isContentUSDCPurchaseGated
} from '~/models/Track'
import { cacheTracksSelectors, CommonState } from '~/store'
import { getUserId } from '~/store/account/selectors'
import { Nullable } from '~/utils'

import { useGatedTrackAccess } from './useGatedContent'

const { getTrack } = cacheTracksSelectors

export const useTrackDogEar = (trackId: ID, hideUnlocked = false) => {
  const streamConditions = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.stream_conditions
  })

  const downloadConditions = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.download_conditions
  })

  const isOwner = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.owner_id === getUserId(state)
  })

  const { hasStreamAccess, hasDownloadAccess } = useGatedTrackAccess(trackId)

  const hideUnlockedStream = !isOwner && hasStreamAccess && hideUnlocked
  const hideUnlockedDownload = !isOwner && hasDownloadAccess && hideUnlocked

  const isPurchaseable = isContentUSDCPurchaseGated(streamConditions)
  const isCollectibileGated = isContentCollectibleGated(streamConditions)
  const isSpecialAccess = isContentSpecialAccess(streamConditions)
  const isDownloadGated = isContentUSDCPurchaseGated(downloadConditions)

  let dogEarType: Nullable<DogEarType> = null

  if (isPurchaseable && !hideUnlockedStream) {
    dogEarType = DogEarType.USDC_PURCHASE
  } else if (isCollectibileGated && !hideUnlockedStream) {
    dogEarType = DogEarType.COLLECTIBLE_GATED
  } else if (isSpecialAccess && !hideUnlockedStream) {
    dogEarType = DogEarType.SPECIAL_ACCESS
  } else if (isDownloadGated && !hideUnlockedDownload) {
    dogEarType = DogEarType.USDC_EXTRAS
  }

  return dogEarType
}
