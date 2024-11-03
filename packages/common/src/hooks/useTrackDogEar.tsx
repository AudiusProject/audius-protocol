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

export const useTrackDogEar = (trackId: ID) => {
  const { data: track } = useGetTrackById({ id: trackId })
  const currentUserId = useSelector(getUserId)

  const { hasStreamAccess, hasDownloadAccess } = useGatedContentAccess(
    track as Nullable<Track>
  )

  if (!track) return null

  const { owner_id, stream_conditions, download_conditions } = track

  const isOwner = owner_id === currentUserId
  const unlockedStream = !isOwner && hasStreamAccess
  const unlockedDownload = !isOwner && hasDownloadAccess

  const isPurchaseable =
    isContentUSDCPurchaseGated(stream_conditions) && !unlockedStream

  const isCollectibileGated =
    isContentCollectibleGated(stream_conditions) && !unlockedStream

  const isSpecialAccess =
    isContentSpecialAccess(stream_conditions) && !unlockedStream

  const isDownloadGated =
    isContentUSDCPurchaseGated(download_conditions) && !unlockedDownload

  let dogEarType: Nullable<DogEarType> = null

  if (isPurchaseable) {
    dogEarType = DogEarType.USDC_PURCHASE
  } else if (isCollectibileGated) {
    dogEarType = DogEarType.COLLECTIBLE_GATED
  } else if (isSpecialAccess) {
    dogEarType = DogEarType.SPECIAL_ACCESS
  } else if (isDownloadGated) {
    dogEarType = DogEarType.USDC_EXTRAS
  }

  return dogEarType
}
