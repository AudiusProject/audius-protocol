import { useSelector } from 'react-redux'

import { DogEarType, ID, isContentUSDCPurchaseGated } from '~/models'
import { CommonState } from '~/store'
import { getUserId } from '~/store/account/selectors'
import { getCollection } from '~/store/cache/collections/selectors'
import { Nullable } from '~/utils'

import { useGatedCollectionAccess } from './useGatedContent'

export const useCollectionDogEar = (collectionId: ID, hideUnlocked = false) => {
  const isPurchaseable = useSelector((state: CommonState) => {
    const collection = getCollection(state, { id: collectionId })
    return isContentUSDCPurchaseGated(collection?.stream_conditions)
  })

  const isOwner = useSelector((state: CommonState) => {
    const collection = getCollection(state, { id: collectionId })
    if (!collection) return false
    return collection.playlist_owner_id === getUserId(state)
  })

  const { hasStreamAccess } = useGatedCollectionAccess(collectionId)

  const hideUnlockedStream = !isOwner && hasStreamAccess && hideUnlocked

  let dogEarType: Nullable<DogEarType> = null

  if (isPurchaseable && !hideUnlockedStream) {
    dogEarType = DogEarType.USDC_PURCHASE
  }

  return dogEarType
}
