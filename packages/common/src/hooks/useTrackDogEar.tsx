import { useCurrentUserId } from '~/api'
import { useTrack } from '~/api/tan-query/useTrack'
import { DogEarType } from '~/models'
import { ID } from '~/models/Identifiers'
import {
  isContentCollectibleGated,
  isContentSpecialAccess,
  isContentUSDCPurchaseGated
} from '~/models/Track'
import { Nullable } from '~/utils'

import { useGatedTrackAccess } from './useGatedContent'

export const useTrackDogEar = (trackId: ID, hideUnlocked = false) => {
  const { data: currentUserId } = useCurrentUserId()
  const { data: track } = useTrack(trackId, {
    select: (track) => {
      return {
        streamConditions: track.stream_conditions,
        downloadConditions: track.download_conditions,
        isOwner: track.owner_id === currentUserId
      }
    }
  })
  const { streamConditions, downloadConditions, isOwner } = track ?? {}

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
