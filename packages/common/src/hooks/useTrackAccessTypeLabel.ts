import { useSelector } from 'react-redux'

import { AccessType } from '~/models/AccessType'
import { ID } from '~/models/Identifiers'
import {
  isContentCollectibleGated,
  isContentSpecialAccess,
  isContentUSDCPurchaseGated
} from '~/models/Track'
import { CommonState } from '~/store'
import { getUserId } from '~/store/account/selectors'
import { getTrack } from '~/store/cache/tracks/selectors'
import { Nullable } from '~/utils'

import { useGatedTrackAccess } from './useGatedContent'

type TrackAccessType = {
  type: Nullable<AccessType>
  isUnlocked?: boolean
  scheduledReleaseDate?: string
}

export const useTrackAccessTypeLabel = (trackId: ID): TrackAccessType => {
  const isOwner = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.owner_id === getUserId(state)
  })

  const streamConditions = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.stream_conditions
  })

  const downloadConditions = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.download_conditions
  })

  const releaseDate = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.release_date
  })

  const isDownloadable = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.is_downloadable
  })

  const isUnlisted = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.is_unlisted
  })

  const { hasStreamAccess, hasDownloadAccess } = useGatedTrackAccess(trackId)

  const isUnlockedStream = !isOwner && hasStreamAccess
  const isUnlockedDownload = !isOwner && hasDownloadAccess
  const isPurchaseable = isContentUSDCPurchaseGated(streamConditions)
  const isCollectibleGated = isContentCollectibleGated(streamConditions)
  const isSpecialAccess = isContentSpecialAccess(streamConditions)
  const isDownloadGated = isContentUSDCPurchaseGated(downloadConditions)
  const isScheduledRelease = releaseDate && new Date(releaseDate) > new Date()

  let type: Nullable<AccessType> = null
  let isUnlocked = false

  if (isScheduledRelease) {
    type = AccessType.SCHEDULED_RELEASE
  } else if (isUnlisted) {
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
  } else if (isDownloadable) {
    type = AccessType.EXTRAS
    isUnlocked = isUnlockedDownload
  }

  return {
    type,
    isUnlocked,
    scheduledReleaseDate: isScheduledRelease ? releaseDate : undefined
  }
}
