import { useSelector } from 'react-redux'

import { ID, isContentUSDCPurchaseGated } from '~/models'
import { CommonState } from '~/store'
import { getCollection } from '~/store/cache/collections/selectors'
import { Nullable } from '~/utils'

import { LockedStatusVariant } from './types'

export const useCollectionLockedStatusVariant = (collectionId: ID) => {
  const streamConditions = useSelector((state: CommonState) => {
    return getCollection(state, { id: collectionId })?.stream_conditions
  })

  const isPurchaseable = isContentUSDCPurchaseGated(streamConditions)

  let variant: Nullable<LockedStatusVariant> = null
  if (isPurchaseable) {
    variant = 'premium'
  }

  return variant
}
