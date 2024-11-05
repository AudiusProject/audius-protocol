import { useSelector } from 'react-redux'

import { useGetTrackById } from '~/api'
import { AccessType } from '~/models/AccessType'
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

type TrackAccessType = {
  type: Nullable<AccessType>
  isUnlocked?: boolean
  scheduledReleaseDate?: string
}

export const useTrackAccessTypeLabel = (trackId: ID): TrackAccessType => {
  const { data: track } = useGetTrackById({ id: trackId })
  const currentUserId = useSelector(getUserId)

  const { hasStreamAccess, hasDownloadAccess } = useGatedContentAccess(
    track as Nullable<Track>
  )

  if (!track) return { type: null }

  const {
    owner_id,
    stream_conditions,
    download_conditions,
    is_downloadable,
    is_unlisted,
    release_date
  } = track

  const isOwner = owner_id === currentUserId
  const isUnlockedStream = !isOwner && hasStreamAccess
  const isUnlockedDownload = !isOwner && hasDownloadAccess

  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)
  const isCollectibleGated = isContentCollectibleGated(stream_conditions)
  const isSpecialAccess = isContentSpecialAccess(stream_conditions)
  const isDownloadGated = isContentUSDCPurchaseGated(download_conditions)
  const isScheduledRelease = release_date && new Date(release_date) > new Date()

  let type: Nullable<AccessType> = null
  let isUnlocked = false

  if (isScheduledRelease) {
    type = AccessType.SCHEDULED_RELEASE
  } else if (is_unlisted) {
    type = AccessType.HIDDEN
  } else if (isPurchaseable) {
    type = AccessType.PREMIUM
    isUnlocked = isUnlockedStream
  } else if (isCollectibleGated) {
    type = AccessType.COLLECTIBLE_GATED
    isUnlocked = isUnlockedStream
  } else if (isSpecialAccess) {
    type = AccessType.SPECIAL_ACCESS
    isUnlocked = isUnlockedStream
  } else if (isDownloadGated) {
    type = AccessType.PREMIUM_EXTRAS
    isUnlocked = isUnlockedDownload
  } else if (is_downloadable) {
    type = AccessType.EXTRAS
    isUnlocked = isUnlockedDownload
  }

  return {
    type,
    isUnlocked,
    scheduledReleaseDate: isScheduledRelease ? release_date : undefined
  }
}
