import { useSelector } from 'react-redux'

import { useGetPlaylistById } from '~/api/collection'
import { AccessType } from '~/models/AccessType'
import { Collection } from '~/models/Collection'
import { ID } from '~/models/Identifiers'
import { isContentUSDCPurchaseGated } from '~/models/Track'
import { getUserId } from '~/store/account/selectors'
import { Nullable } from '~/utils'

import { useGatedContentAccess } from './useGatedContent'

type CollectionAccessType = {
  type: Nullable<AccessType>
  scheduledReleaseDate?: string
  isUnlocked?: boolean
}

export const useCollectionAccessTypeLabel = (
  collectionId: ID
): CollectionAccessType => {
  const { data: collection } = useGetPlaylistById({
    playlistId: collectionId
  })
  const currentUserId = useSelector(getUserId)

  const { hasStreamAccess } = useGatedContentAccess(
    collection as Nullable<Collection>
  )

  if (!collection) return { type: null }

  const { playlist_owner_id, stream_conditions, is_private, release_date } =
    collection

  const isOwner = playlist_owner_id === currentUserId
  const isUnlockedStream = !isOwner && hasStreamAccess

  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)
  const isScheduledRelease = release_date && new Date(release_date) > new Date()

  let type: Nullable<AccessType> = null
  let isUnlocked = false

  if (isScheduledRelease) {
    type = AccessType.SCHEDULED_RELEASE
  } else if (is_private) {
    type = AccessType.HIDDEN
  } else if (isPurchaseable) {
    type = AccessType.PREMIUM
    isUnlocked = isUnlockedStream
  }

  return {
    type,
    isUnlocked,
    scheduledReleaseDate: isScheduledRelease ? release_date : undefined
  }
}
