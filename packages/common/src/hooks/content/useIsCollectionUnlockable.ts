import { useSelector } from 'react-redux'

import { ID, isContentUSDCPurchaseGated } from '~/models'
import { CommonState } from '~/store'
import { getCollection } from '~/store/cache/collections/selectors'

export const useIsCollectionUnlockable = (collectionId: ID) => {
  return useSelector((state: CommonState) => {
    const streamConditions = getCollection(state, {
      id: collectionId
    })?.stream_conditions

    return isContentUSDCPurchaseGated(streamConditions)
  })
}
