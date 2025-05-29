import { useCollection } from '~/api'
import { ID, isContentUSDCPurchaseGated } from '~/models'
import { Nullable } from '~/utils'

import { LockedStatusVariant } from './types'

export const useCollectionLockedStatusVariant = (collectionId: ID) => {
  const { data: streamConditions } = useCollection(collectionId, {
    select: (collection) => collection?.stream_conditions
  })

  const isPurchaseable = isContentUSDCPurchaseGated(streamConditions)

  let variant: Nullable<LockedStatusVariant> = null
  if (isPurchaseable) {
    variant = 'premium'
  }

  return variant
}
