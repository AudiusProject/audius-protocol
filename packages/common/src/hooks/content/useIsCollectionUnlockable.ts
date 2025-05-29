import { useCollection } from '~/api'
import { ID, isContentUSDCPurchaseGated } from '~/models'

export const useIsCollectionUnlockable = (collectionId: ID) => {
  const { data: streamConditions } = useCollection(collectionId, {
    select: (collection) => collection?.stream_conditions
  })

  return isContentUSDCPurchaseGated(streamConditions)
}
