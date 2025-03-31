import { useCollection, useCurrentUserId } from '~/api'
import { DogEarType, ID, isContentUSDCPurchaseGated } from '~/models'
import { Nullable } from '~/utils'

import { useGatedCollectionAccess } from './useGatedContent'

export const useCollectionDogEar = (collectionId: ID, hideUnlocked = false) => {
  const { data: currentUserId } = useCurrentUserId()
  const { data: partialCollection } = useCollection(collectionId, {
    select: (collection) => {
      return {
        isPurchaseable: isContentUSDCPurchaseGated(
          collection?.stream_conditions
        ),
        isOwner: collection?.playlist_owner_id === currentUserId
      }
    }
  })
  const { isPurchaseable, isOwner } = partialCollection ?? {}

  const { hasStreamAccess } = useGatedCollectionAccess(collectionId)

  const hideUnlockedStream = !isOwner && hasStreamAccess && hideUnlocked

  let dogEarType: Nullable<DogEarType> = null

  if (isPurchaseable && !hideUnlockedStream) {
    dogEarType = DogEarType.USDC_PURCHASE
  }

  return dogEarType
}
