import { useSelector } from 'react-redux'

import { useGetTrackById } from '~/api'
import { DogEarType } from '~/models'
import { ID } from '~/models/Identifiers'
import {
  isContentCollectibleGated,
  isContentSpecialAccess,
  isContentUSDCPurchaseGated,
  Track
} from '~/models/Track'
import { getUserId } from '~/store/account/selectors'
import { Nullable } from '~/utils'

import { useGatedContentAccess } from './useGatedContent'

export const useTrackDogEar = (trackId: ID, hideUnlocked = false) => {
  const { data: track } = useGetTrackById({ id: trackId })
  const currentUserId = useSelector(getUserId)

  const { hasStreamAccess, hasDownloadAccess } = useGatedContentAccess(
    track as Nullable<Track>
  )

  if (!track) return null

  const { owner_id, stream_conditions, download_conditions } = track

  const isOwner = owner_id === currentUserId
  const hideUnlockedStream = !isOwner && hasStreamAccess && hideUnlocked
  const hideUnlockedDownload = !isOwner && hasDownloadAccess && hideUnlocked

  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)
  const isCollectibileGated = isContentCollectibleGated(stream_conditions)
  const isSpecialAccess = isContentSpecialAccess(stream_conditions)
  const isDownloadGated = isContentUSDCPurchaseGated(download_conditions)

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
