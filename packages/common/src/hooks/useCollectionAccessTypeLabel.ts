import { useSelector } from 'react-redux'

import { AccessType } from '~/models/AccessType'
import { ID } from '~/models/Identifiers'
import { isContentUSDCPurchaseGated } from '~/models/Track'
import { CommonState } from '~/store'
import { getUserId } from '~/store/account/selectors'
import { getCollection } from '~/store/cache/collections/selectors'
import { Nullable } from '~/utils'

import { useGatedCollectionAccess } from './useGatedContent'

type CollectionAccessType = {
  type: Nullable<AccessType>
  scheduledReleaseDate?: string
  isUnlocked?: boolean
}

export const useCollectionAccessTypeLabel = (
  collectionId: ID
): CollectionAccessType => {
  const { hasStreamAccess } = useGatedCollectionAccess(collectionId)

  const isPurchaseable = useSelector((state: CommonState) => {
    return isContentUSDCPurchaseGated(
      getCollection(state, { id: collectionId })?.stream_conditions
    )
  })

  const releaseDate = useSelector((state: CommonState) => {
    return getCollection(state, { id: collectionId })?.release_date
  })

  const isScheduledRelease = releaseDate && new Date(releaseDate) > new Date()

  const isPrivate = useSelector((state: CommonState) => {
    return getCollection(state, { id: collectionId })?.is_private
  })

  const isOwner = useSelector((state: CommonState) => {
    return (
      getCollection(state, { id: collectionId })?.playlist_owner_id ===
      getUserId(state)
    )
  })

  const isUnlockedStream = !isOwner && hasStreamAccess

  let type: Nullable<AccessType> = null
  let isUnlocked = false

  if (isScheduledRelease) {
    type = AccessType.SCHEDULED_RELEASE
  } else if (isPrivate) {
    type = AccessType.HIDDEN
  } else if (isPurchaseable) {
    type = AccessType.PREMIUM
    isUnlocked = isUnlockedStream
  }

  return {
    type,
    isUnlocked,
    scheduledReleaseDate: isScheduledRelease ? releaseDate : undefined
  }
}
