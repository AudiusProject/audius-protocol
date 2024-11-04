import { useSelector } from 'react-redux'

import { useGetPlaylistById } from '~/api'
import {
  Collection,
  DogEarType,
  ID,
  isContentUSDCPurchaseGated
} from '~/models'
import { getUserId } from '~/store/account/selectors'
import { Nullable } from '~/utils'

import { useGatedContentAccess } from './useGatedContent'

export const useCollectionDogEar = (collectionId: ID, hideUnlocked = false) => {
  const { data: collection } = useGetPlaylistById({ playlistId: collectionId })
  const currentUserId = useSelector(getUserId)

  const { hasStreamAccess } = useGatedContentAccess(
    collection as Nullable<Collection>
  )

  if (!collection) return null
  const { playlist_owner_id, stream_conditions } = collection

  const isOwner = playlist_owner_id === currentUserId
  const hideUnlockedStream = !isOwner && hasStreamAccess && hideUnlocked
  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)

  let dogEarType: Nullable<DogEarType> = null

  if (isPurchaseable && !hideUnlockedStream) {
    dogEarType = DogEarType.USDC_PURCHASE
  }

  return dogEarType
}
