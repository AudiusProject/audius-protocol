import { initialCacheState } from 'store/cache/reducer'

import { ID } from '../../../models'

import { SET_COLLECTION_PERMALINKS } from './actions'
import { CollectionsCacheState } from './types'

const initialState = {
  ...initialCacheState,
  permalinks: {}
}

const actionsMap = {
  [SET_COLLECTION_PERMALINKS](
    state: CollectionsCacheState,
    action: { permalinksToIds: { [permalink: string]: ID } }
  ) {
    return {
      ...state,
      permalinks: {
        ...state.permalinks,
        ...action.permalinksToIds
      }
    }
  }
}

const reducer = (state = initialState, action: any) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}
export default reducer
